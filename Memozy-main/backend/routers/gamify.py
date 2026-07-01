from datetime import date, datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.supabase import get_supabase

router = APIRouter(prefix="/gamify", tags=["gamify"])

BADGES = {
    "first_deck": lambda p, _: p.get("deck_count", 0) >= 1,
    "streak_7": lambda p, _: p.get("streak_count", 0) >= 7,
    "streak_30": lambda p, _: p.get("streak_count", 0) >= 30,
    "level_5": lambda p, _: p.get("level", 1) >= 5,
    "cards_100": lambda p, stats: stats.get("total_cards_studied", 0) >= 100,
    "cards_500": lambda p, stats: stats.get("total_cards_studied", 0) >= 500,
}


class StudyCompleteRequest(BaseModel):
    user_id: str
    deck_id: str
    cards_reviewed: int
    correct_count: int


@router.post("/study-complete")
async def study_complete(body: StudyCompleteRequest):
    try:
        sb = get_supabase()
        profile_result = sb.table("profiles").select("*").eq("id", body.user_id).single().execute()
        profile = profile_result.data

        # ── Streak logic ──────────────────────────────────────────────────────
        today = date.today()
        last_date = profile.get("streak_last_date")
        streak = profile.get("streak_count", 0)

        if last_date:
            last = date.fromisoformat(str(last_date)[:10])
            delta = (today - last).days
            if delta == 0:
                pass          # already studied today, keep streak
            elif delta == 1:
                streak += 1   # consecutive day
            else:
                streak = 1    # broken
        else:
            streak = 1

        # ── Duolingo-style XP ─────────────────────────────────────────────────
        #   Base 10 XP for finishing any session
        #   +5 XP per correct card
        #   +15 XP accuracy bonus at ≥ 80 %
        #   +25 XP perfect score bonus
        #   Streak multiplier: ×1.25 at 3d, ×1.5 at 7d, ×2.0 at 30d
        accuracy = body.correct_count / body.cards_reviewed if body.cards_reviewed > 0 else 0
        base   = 10
        card_xp = body.correct_count * 5
        acc_bonus = 25 if accuracy == 1.0 else (15 if accuracy >= 0.8 else 0)

        if streak >= 30:
            mult = 2.0
        elif streak >= 7:
            mult = 1.5
        elif streak >= 3:
            mult = 1.25
        else:
            mult = 1.0

        xp_earned = round((base + card_xp + acc_bonus) * mult)

        # ── Update profile (only columns that definitely exist) ───────────────
        current_xp    = profile.get("xp", 0) + xp_earned
        current_level = profile.get("level", 1)
        new_level     = current_xp // 500 + 1
        leveled_up    = new_level > current_level

        profile_update: dict = {
            "xp": current_xp,
            "level": new_level,
            "streak_count": streak,
            "streak_last_date": today.isoformat(),
        }
        if "max_streak" in profile:
            profile_update["max_streak"] = max(profile.get("max_streak", 0), streak)
        if "weekly_xp" in profile:
            profile_update["weekly_xp"] = profile.get("weekly_xp", 0) + xp_earned

        sb.table("profiles").update(profile_update).eq("id", body.user_id).execute()

        # ── Study session log (optional — skip if table/columns differ) ───────
        total_cards = 0
        try:
            sb.table("study_sessions").insert({
                "user_id": body.user_id,
                "deck_id": body.deck_id,
                "cards_studied": body.cards_reviewed,
                "xp_earned": xp_earned,
            }).execute()
            sessions_result = sb.table("study_sessions").select("cards_studied").eq("user_id", body.user_id).execute()
            total_cards = sum(s["cards_studied"] for s in sessions_result.data)
        except Exception:
            pass

        # ── Badges ────────────────────────────────────────────────────────────
        badges_earned: list[str] = []
        try:
            existing_badges = sb.table("badges").select("badge_type").eq("user_id", body.user_id).execute()
            earned_types = {b["badge_type"] for b in existing_badges.data}
            decks_count = sb.table("decks").select("id", count="exact").eq("user_id", body.user_id).execute().count or 0
            updated_profile = {**profile, "level": new_level, "streak_count": streak, "deck_count": decks_count}
            stats = {"total_cards_studied": total_cards}
            for badge_type, check_fn in BADGES.items():
                if badge_type not in earned_types and check_fn(updated_profile, stats):
                    sb.table("badges").insert({"user_id": body.user_id, "badge_type": badge_type}).execute()
                    badges_earned.append(badge_type)
        except Exception:
            pass

        return {
            "xp_earned": xp_earned,
            "new_total_xp": current_xp,
            "leveled_up": leveled_up,
            "new_level": new_level,
            "streak": streak,
            "badges_earned": badges_earned,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/profile/{user_id}")
async def get_profile(user_id: str):
    try:
        sb = get_supabase()
        profile = sb.table("profiles").select("*").eq("id", user_id).single().execute()
        badges = sb.table("badges").select("*").eq("user_id", user_id).execute()
        sessions = sb.table("study_sessions").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(90).execute()
        return {"profile": profile.data, "badges": badges.data, "recent_sessions": sessions.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
