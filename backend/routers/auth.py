from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from utils.supabase import get_supabase

router = APIRouter(prefix="/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    username: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup")
async def signup(body: SignupRequest):
    sb = get_supabase()
    try:
        result = sb.auth.sign_up(
            {"email": body.email, "password": body.password, "options": {"data": {"username": body.username}}}
        )
        if result.user is None:
            raise HTTPException(status_code=400, detail="Signup failed")
        return {"user": result.user, "session": result.session}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(body: LoginRequest):
    sb = get_supabase()
    try:
        result = sb.auth.sign_in_with_password({"email": body.email, "password": body.password})
        if result.user is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return {"user": result.user, "session": result.session}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/logout")
async def logout():
    sb = get_supabase()
    try:
        sb.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
