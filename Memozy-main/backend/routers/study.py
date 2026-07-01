from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.supabase import get_supabase
from utils.sm2 import calculate_sm2

router = APIRouter(prefix="/study", tags=["study"])


class CardRating(BaseModel):
    card_id: str
    quality: int  # 0-5


class SessionCreate(BaseModel):
    user_id: str
    deck_id: str


@router.get("/due/{deck_id}")
async def get_due_cards(deck_id: str):
    try:
        sb = get_supabase()
        now = datetime.utcnow().isoformat()
        result = (
            sb.table("cards")
            .select("*")
            .eq("deck_id", deck_id)
            .or_(f"next_review.is.null,next_review.lte.{now}")
            .execute()
        )
        return {"cards": result.data, "count": len(result.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rate")
async def rate_card(body: CardRating):
    try:
        sb = get_supabase()
        card_result = sb.table("cards").select("*").eq("id", body.card_id).single().execute()
        card = card_result.data

        sm2 = calculate_sm2(
            ease_factor=float(card.get("ease_factor", 2.5)),
            interval_days=int(card.get("interval_days", 1)),
            quality=body.quality,
        )

        difficulty = 1 if body.quality >= 4 else (2 if body.quality >= 2 else 3)

        updated = sb.table("cards").update({
            "ease_factor": sm2.ease_factor,
            "interval_days": sm2.interval_days,
            "next_review": sm2.next_review.isoformat(),
            "difficulty": difficulty,
        }).eq("id", body.card_id).execute()

        return {"card": updated.data[0] if updated.data else None, "next_review": sm2.next_review.isoformat()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/all/{deck_id}")
async def get_all_cards(deck_id: str):
    """Return all cards in a deck for practice mode (shuffled)."""
    import random
    try:
        sb = get_supabase()
        result = sb.table("cards").select("*").eq("deck_id", deck_id).execute()
        cards = result.data
        random.shuffle(cards)
        return {"cards": cards, "count": len(cards)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session")
async def create_session(body: SessionCreate):
    try:
        sb = get_supabase()
        result = sb.table("study_sessions").insert({
            "user_id": body.user_id,
            "deck_id": body.deck_id,
            "cards_studied": 0,
            "xp_earned": 0,
        }).execute()
        return {"session": result.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
