from fastapi import APIRouter, HTTPException, Request
import os
import traceback
from supabase import create_client
from dependencies import check_enterprise_tier
from services.ai_service import generate_suggested_reply, chat_with_pulse
from rate_limiter import limiter

router = APIRouter()

@router.post("/send-reply")
@limiter.limit("10/minute")
async def send_reply(data: dict, request: Request):
    try:
        user_id = data.get("user_id") # Admin's Supabase ID
        await check_enterprise_tier(user_id)
        
        ticket_id = data.get("ticket_id")
        message_content = data.get("message")
        
        if not ticket_id or not message_content:
            raise HTTPException(status_code=400, detail="ticket_id and message are required")

        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
        supabase = create_client(url, key)

        # 1. Fetch ticket details to get Discord channel and user ID
        ticket_res = supabase.table("tickets").select("discord_id, discord_channel_id, discord_guild_id").eq("id", ticket_id).execute()
        if not ticket_res.data:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        ticket = ticket_res.data[0]
        discord_user_id = ticket.get("discord_id")
        channel_id = ticket.get("discord_channel_id")
        
        if not channel_id:
            raise HTTPException(status_code=400, detail="This ticket was not created via Discord or is missing channel information.")

        # 2. Access the Discord bot via app state
        bot = getattr(request.app.state, "bot", None)
        if not bot:
            raise HTTPException(status_code=503, detail="Discord bot is not running.")

        # 3. Send message to Discord
        try:
            channel = bot.get_channel(int(channel_id))
            if not channel:
                channel = await bot.fetch_channel(int(channel_id))
            
            if not channel:
                raise ValueError("Channel not found")

            # Format the message: Mention user if available
            mention = f"<@{discord_user_id}> " if discord_user_id else ""
            formatted_message = f"**Update on your ticket (ID: {ticket_id}):**\n\n{mention}{message_content}"
            
            await channel.send(formatted_message)
            return {"status": "success", "message": "Reply sent to Discord"}
            
        except Exception as discord_err:
            print(f"Discord Send Error: {discord_err}")
            raise HTTPException(status_code=500, detail=f"Failed to send Discord message: {str(discord_err)}")
            
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Send Reply Endpoint Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/suggest-reply")
@limiter.limit("5/minute")
async def suggest_reply(data: dict, request: Request):
    try:
        user_id = data.get("user_id")
        await check_enterprise_tier(user_id)
        
        ticket_id = data.get("ticket_id")
        if not ticket_id:
            raise HTTPException(status_code=400, detail="ticket_id is required")

        # Convert to int if it's a string bigint
        try:
            ticket_id = int(ticket_id)
        except (ValueError, TypeError):
            pass

        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
        if not url or not key:
            raise ValueError("Supabase configuration missing in environment")
            
        supabase = create_client(url, key)

        # 1. Fetch ticket details
        ticket_res = supabase.table("tickets").select("title, description").eq("id", ticket_id).execute()
        if not ticket_res.data:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        ticket = ticket_res.data[0]
        content = f"Title: {ticket.get('title', 'Untitled')}\nDescription: {ticket.get('description', 'No description provided')}"

        # 2. Fetch Knowledge Base entries
        try:
            kb_res = supabase.table("knowledge_base").select("question, answer").execute()
            kb_entries = kb_res.data or []
        except Exception as kb_err:
            print(f"Warning: KB fetch failed: {kb_err}")
            kb_entries = []
            
        kb_context = "\n".join([f"Q: {e['question']}\nA: {e['answer']}" for e in kb_entries])

        # 3. Generate suggestion
        suggestion = generate_suggested_reply(content, kb_context)
        return {"suggestion": suggestion}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Suggestion Endpoint Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/chat")
@limiter.limit("10/minute")
async def ai_chat(data: dict, request: Request):
    try:
        user_id = data.get("user_id")
        await check_enterprise_tier(user_id)
        
        query = data.get("query")
        context = data.get("context", {})
        
        if not query:
            raise HTTPException(status_code=400, detail="query is required")

        response = chat_with_pulse(query, context)
        return {"response": response}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Chat Endpoint Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
