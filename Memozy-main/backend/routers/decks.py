from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.supabase import get_supabase

router = APIRouter(prefix="/decks", tags=["decks"])


class DeckCreate(BaseModel):
    user_id: str
    title: str
    description: str = ""
    is_public: bool = False


class DeckUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    is_public: bool | None = None


@router.get("/")
async def list_decks(user_id: str):
    try:
        sb = get_supabase()
        result = sb.table("decks").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return {"decks": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_deck(body: DeckCreate):
    try:
        sb = get_supabase()
        result = sb.table("decks").insert(body.model_dump()).execute()
        return {"deck": result.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{deck_id}")
async def get_deck(deck_id: str):
    try:
        sb = get_supabase()
        result = sb.table("decks").select("*, cards(*)").eq("id", deck_id).single().execute()
        return {"deck": result.data}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{deck_id}")
async def update_deck(deck_id: str, body: DeckUpdate):
    try:
        sb = get_supabase()
        updates = {k: v for k, v in body.model_dump().items() if v is not None}
        result = sb.table("decks").update(updates).eq("id", deck_id).execute()
        return {"deck": result.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{deck_id}")
async def delete_deck(deck_id: str):
    try:
        sb = get_supabase()
        sb.table("cards").delete().eq("deck_id", deck_id).execute()
        sb.table("decks").delete().eq("id", deck_id).execute()
        return {"message": "Deck deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/public/{deck_id}")
async def get_public_deck(deck_id: str):
    # Accessible to anyone with the link, regardless of is_public flag.
    # is_public only controls social-feed visibility.
    try:
        sb = get_supabase()
        result = sb.table("decks").select("*, cards(*)").eq("id", deck_id).single().execute()
        return {"deck": result.data}
    except Exception as e:
        raise HTTPException(status_code=404, detail="Deck not found")
