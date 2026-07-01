import json
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from utils.groq_client import get_groq
from utils.supabase import get_supabase
from utils.pdf_parser import extract_text_from_pdf
from utils.image_parser import extract_text_from_image

router = APIRouter(prefix="/cards", tags=["cards"])


_DIFFICULTY_CONTEXT = {
    "preclinical": (
        "The student is learning basic medical sciences. "
        "Focus on mechanisms, biochemical pathways, and pathophysiology. "
        "Add a mnemonic or memory trick in the 'hint' field (e.g. MUDPILES, VITAMINS ABCDE) wherever helpful."
    ),
    "clinical": (
        "The student is learning clinical medicine. "
        "Frame questions as clinical presentations: 'A patient presents with...', 'Next best step?', 'Most likely diagnosis?'. "
        "Put key differentiators, high-yield facts, or a one-line vignette in the 'hint' field."
    ),
    "standard": "Create clear, concise question-answer flashcards.",
}


class TextGenerateRequest(BaseModel):
    text: str
    deck_id: str
    num_cards: int = 10
    language: str = "English"
    difficulty_mode: str = "standard"


def _generate_cards_from_text(
    text: str, num_cards: int, language: str = "English", difficulty_mode: str = "standard"
) -> list[dict]:
    groq = get_groq()
    mode_context = _DIFFICULTY_CONTEXT.get(difficulty_mode, _DIFFICULTY_CONTEXT["standard"])
    response = groq.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": (
                    f"Create {num_cards} flashcards from the text below.\n\n"
                    f"IMPORTANT: Write ALL flashcard content in {language}.\n"
                    f"{mode_context}\n\n"
                    "For EACH card return exactly these 3 fields:\n"
                    "- front: a clear question or term\n"
                    "- back: concise answer (1-3 sentences)\n"
                    "- hint: mnemonic, memory trick, or clinical pearl (brief string, empty string if none)\n"
                    "Return ONLY a valid JSON array, no other text:\n"
                    '[{"front":"...","back":"...","hint":"..."}, ...]\n\n'
                    f"TEXT:\n{text[:8000]}"
                ),
            }
        ],
        max_tokens=4096,
        temperature=0.6,
    )
    content = response.choices[0].message.content or "[]"
    start = content.find("[")
    end = content.rfind("]") + 1
    if start == -1 or end == 0:
        raise ValueError("No JSON array found in Groq response")
    return json.loads(content[start:end])


def _save_cards(deck_id: str, cards: list[dict]) -> list[dict]:
    sb = get_supabase()
    rows = [
        {
            "deck_id": deck_id,
            "front": c.get("front", ""),
            "back": c.get("back", ""),
            "hint": c.get("hint") or "",
            "tags": c.get("tags") or [],
        }
        for c in cards
    ]
    result = sb.table("cards").insert(rows).execute()
    sb.table("decks").update({"card_count": len(rows)}).eq("id", deck_id).execute()
    return result.data


@router.post("/generate/text")
async def generate_from_text(body: TextGenerateRequest):
    try:
        cards = _generate_cards_from_text(body.text, body.num_cards, body.language, body.difficulty_mode)
        saved = _save_cards(body.deck_id, cards)
        return {"cards": saved, "count": len(saved)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/pdf")
async def generate_from_pdf(
    file: UploadFile = File(...),
    deck_id: str = Form(...),
    num_cards: int = Form(10),
    language: str = Form("English"),
    difficulty_mode: str = Form("standard"),
):
    try:
        file_bytes = await file.read()
        text = extract_text_from_pdf(file_bytes)
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        cards = _generate_cards_from_text(text, num_cards, language, difficulty_mode)
        saved = _save_cards(deck_id, cards)
        return {"cards": saved, "count": len(saved)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/image")
async def generate_from_image(
    file: UploadFile = File(...),
    deck_id: str = Form(...),
    num_cards: int = Form(10),
    language: str = Form("English"),
    difficulty_mode: str = Form("standard"),
):
    try:
        file_bytes = await file.read()
        mime = file.content_type or "image/jpeg"
        text = extract_text_from_image(file_bytes, mime)
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from image")
        cards = _generate_cards_from_text(text, num_cards, language, difficulty_mode)
        saved = _save_cards(deck_id, cards)
        return {"cards": saved, "count": len(saved)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class CreateCardRequest(BaseModel):
    deck_id: str
    front: str
    back: str = ""
    hint: str = ""
    tags: list[str] = []


def _sync_card_count(sb, deck_id: str):
    result = sb.table("cards").select("id", count="exact").eq("deck_id", deck_id).execute()
    sb.table("decks").update({"card_count": result.count or 0}).eq("id", deck_id).execute()


@router.post("/")
async def create_card(body: CreateCardRequest):
    try:
        sb = get_supabase()
        result = sb.table("cards").insert({
            "deck_id": body.deck_id,
            "front": body.front,
            "back": body.back,
            "hint": body.hint,
            "tags": body.tags,
        }).execute()
        _sync_card_count(sb, body.deck_id)
        return {"card": result.data[0] if result.data else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{deck_id}")
async def get_cards(deck_id: str):
    try:
        sb = get_supabase()
        result = sb.table("cards").select("*").eq("deck_id", deck_id).execute()
        return {"cards": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class UpdateCardRequest(BaseModel):
    front: str | None = None
    back: str | None = None
    hint: str | None = None
    tags: list[str] | None = None
    difficulty: int | None = None
    next_review: str | None = None
    interval_days: float | None = None
    ease_factor: float | None = None


@router.put("/{card_id}")
async def update_card(card_id: str, body: UpdateCardRequest):
    try:
        sb = get_supabase()
        # exclude_none=True skips unset fields, but tags=[] must still be saved
        update_data = {k: v for k, v in body.dict().items() if v is not None or k == "tags"}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        result = sb.table("cards").update(update_data).eq("id", card_id).execute()
        return {"card": result.data[0] if result.data else None}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{card_id}")
async def delete_card(card_id: str):
    try:
        sb = get_supabase()
        card = sb.table("cards").select("deck_id").eq("id", card_id).maybe_single().execute()
        sb.table("cards").delete().eq("id", card_id).execute()
        if card.data:
            _sync_card_count(sb, card.data["deck_id"])
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
