from fastapi import APIRouter, HTTPException
import os
from dependencies import check_enterprise_tier

router = APIRouter()

@router.post("/suggest-reply")
async def suggest_reply(data: dict):
    try:
        user_id = data.get("user_id")
        await check_enterprise_tier(user_id)
        
        ticket_id = data.get("ticket_id")
        if not ticket_id:
            raise HTTPException(status_code=400, detail="ticket_id is required")

        from supabase import create_client
        from services.ai_service import generate_suggested_reply
        
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
        supabase = create_client(url, key)

        # 1. Fetch ticket details
        ticket_res = supabase.table("tickets").select("title, description").eq("id", ticket_id).execute()
        if not ticket_res.data:
            raise HTTPException(status_code=404, detail="Ticket not found")
        ticket = ticket_res.data[0]
        content = f"Title: {ticket['title']}\nDescription: {ticket['description']}"

        # 2. Fetch Knowledge Base entries
        kb_res = supabase.table("knowledge_base").select("question, answer").execute()
        kb_entries = kb_res.data or []
        kb_context = "\n".join([f"Q: {e['question']}\nA: {e['answer']}" for e in kb_entries])

        # 3. Generate suggestion
        suggestion = generate_suggested_reply(content, kb_context)
        return {"suggestion": suggestion}
    except Exception as e:
        print(f"Suggestion Endpoint Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
