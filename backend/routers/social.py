from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from utils.supabase import get_supabase

router = APIRouter(prefix="/social", tags=["social"])


@router.get("/leaderboard")
async def leaderboard(user_id: str):
    try:
        sb = get_supabase()
        follows = sb.table("follows").select("following_id").eq("follower_id", user_id).execute()
        following_ids = [f["following_id"] for f in follows.data] + [user_id]

        week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
        sessions = (
            sb.table("study_sessions")
            .select("user_id, xp_earned")
            .in_("user_id", following_ids)
            .gte("created_at", week_ago)
            .execute()
        )

        xp_map: dict[str, int] = {}
        for s in sessions.data:
            xp_map[s["user_id"]] = xp_map.get(s["user_id"], 0) + s["xp_earned"]

        sorted_users = sorted(xp_map.items(), key=lambda x: x[1], reverse=True)[:10]

        leaderboard_data = []
        for rank, (uid, xp) in enumerate(sorted_users, 1):
            profile = sb.table("profiles").select("id, username, avatar_url, level").eq("id", uid).single().execute()
            leaderboard_data.append({**profile.data, "weekly_xp": xp, "rank": rank})

        return {"leaderboard": leaderboard_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/follow/{target_user_id}")
async def follow_user(target_user_id: str, user_id: str):
    try:
        sb = get_supabase()
        sb.table("follows").insert({"follower_id": user_id, "following_id": target_user_id}).execute()
        return {"message": f"Now following {target_user_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/follow/{target_user_id}")
async def unfollow_user(target_user_id: str, user_id: str):
    try:
        sb = get_supabase()
        sb.table("follows").delete().eq("follower_id", user_id).eq("following_id", target_user_id).execute()
        return {"message": f"Unfollowed {target_user_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/feed")
async def social_feed(user_id: str):
    try:
        sb = get_supabase()
        follows = sb.table("follows").select("following_id").eq("follower_id", user_id).execute()
        following_ids = [f["following_id"] for f in follows.data]
        if not following_ids:
            return {"decks": []}
        result = (
            sb.table("decks")
            .select("*, profiles(username, avatar_url)")
            .in_("user_id", following_ids)
            .eq("is_public", True)
            .order("created_at", desc=True)
            .limit(20)
            .execute()
        )
        return {"decks": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_users(q: str):
    try:
        sb = get_supabase()
        result = sb.table("profiles").select("id, username, avatar_url, level").ilike("username", f"%{q}%").limit(10).execute()
        return {"users": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
