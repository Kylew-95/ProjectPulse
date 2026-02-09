from fastapi import APIRouter, HTTPException, Depends
from supabase import create_client
import os
import json
from datetime import datetime
from dependencies import check_pro_tier

router = APIRouter()

def get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    return create_client(url, key)

@router.get("/")
async def get_history(user_id: str):
    try:
        await check_pro_tier(user_id)
        supabase = get_supabase()
        res = supabase.table("ai_chat_history")\
            .select("id, title, created_at, updated_at")\
            .eq("user_id", user_id)\
            .order("updated_at", desc=True)\
            .execute()
        return res.data
    except Exception as e:
        print(f"Error fetching AI history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{chat_id}")
async def get_chat_details(chat_id: str, user_id: str):
    try:
        await check_pro_tier(user_id)
        supabase = get_supabase()
        res = supabase.table("ai_chat_history")\
            .select("*")\
            .eq("id", chat_id)\
            .eq("user_id", user_id)\
            .single()\
            .execute()
        return res.data
    except Exception as e:
        print(f"Error fetching AI chat details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def save_chat(data: dict):
    try:
        user_id = data.get("user_id")
        await check_pro_tier(user_id)
        chat_id = data.get("id") # Optional, for updates
        title = data.get("title", "New Chat")
        messages = data.get("messages", [])

        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")

        if not title or title == "New Chat":
            if messages:
                # Find first user message for title
                first_msg = next((m for m in messages if m.get("role") == "user"), None)
                if first_msg:
                    title = first_msg.get("content", "New Chat")[:40] + "..."
            else:
                title = "New Chat"

        supabase = get_supabase()
        
        payload = {
            "user_id": user_id,
            "title": title,
            "messages": messages,
            "updated_at": datetime.utcnow().isoformat()
        }

        if chat_id:
            # Update existing
            res = supabase.table("ai_chat_history")\
                .update(payload)\
                .eq("id", chat_id)\
                .execute()
        else:
            # Create new
            res = supabase.table("ai_chat_history")\
                .insert(payload)\
                .execute()
                
        return res.data[0] if res.data else {}
    except Exception as e:
        print(f"Error saving AI chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{chat_id}")
async def delete_chat(chat_id: str, user_id: str):
    try:
        await check_pro_tier(user_id)
        supabase = get_supabase()
        supabase.table("ai_chat_history")\
            .delete()\
            .eq("id", chat_id)\
            .eq("user_id", user_id)\
            .execute()
        return {"status": "success"}
    except Exception as e:
        print(f"Error deleting AI chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{chat_id}")
async def rename_chat(chat_id: str, data: dict):
    try:
        user_id = data.get("user_id")
        await check_pro_tier(user_id)
        title = data.get("title")
        
        if not user_id or not title:
            raise HTTPException(status_code=400, detail="user_id and title are required")

        supabase = get_supabase()
        res = supabase.table("ai_chat_history")\
            .update({"title": title, "updated_at": datetime.utcnow().isoformat()})\
            .eq("id", chat_id)\
            .eq("user_id", user_id)\
            .execute()
            
        return res.data[0] if res.data else {}
    except Exception as e:
        print(f"Error renaming AI chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))
