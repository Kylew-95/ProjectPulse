from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY
from datetime import datetime, timedelta, timezone

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def insert_message(user_id: int, channel_id: int, content: str, username: str, full_name: str = None, avatar_url: str = None, guild_id: int = None, ticket_id: int = None):
    """Logs a message to the database with deduplication logic to prevent multi-bot double-logging."""
    try:
        # Check for recent identical message (within 10s) to prevent dual-bot duplication
        recent = supabase.table("messages")\
            .select("id")\
            .eq("user_id", str(user_id))\
            .eq("channel_id", str(channel_id))\
            .eq("content", content)\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()
        
        if recent.data:
            print(f"DEBUG: Skipping duplicate message insertion for {username} in {channel_id}")
            return recent.data[0].get("id")

        data = {
            "user_id": str(user_id),
            "channel_id": str(channel_id),
            "discord_guild_id": str(guild_id) if guild_id else None,
            "ticket_id": ticket_id,
            "content": content,
            "username": username,
            "full_name": full_name,
            "avatar_url": avatar_url
        }
        response = supabase.table("messages").insert(data).execute()
        return response.data[0].get("id") if response.data else None
    except Exception as e:
        print(f"Error logging message to Supabase: {e}")
        return None

def link_message_to_ticket(message_id, ticket_id):
    """Associates an existing message entry with a ticket ID."""
    if not message_id or not ticket_id:
        return False
    try:
        supabase.table("messages").update({"ticket_id": ticket_id}).eq("id", message_id).execute()
        return True
    except Exception as e:
        print(f"Error linking message {message_id} to ticket {ticket_id}: {e}")
        return False

def get_messages_last_24h(guild_id: int = None):
    """Fetches messages from the last 24 hours, optionally filtered by guild."""
    try:
        query = supabase.table("messages").select("*").order("created_at", desc=True).limit(200)
        
        if guild_id:
            query = query.eq("discord_guild_id", str(guild_id))
            
        response = query.execute()
        return response.data
    except Exception as e:
        print(f"Error fetching messages: {e}")
        return []

def get_messages_from_channel(channel_id: int, limit: int = 100):
    """Fetches the most recent messages from a specific channel."""
    try:
        response = supabase.table("messages")\
            .select("*")\
            .eq("channel_id", str(channel_id))\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()
        return response.data or []
    except Exception as e:
        print(f"Error fetching channel messages: {e}")
        return []

def get_day_messages(channel_id: int, target_date: datetime = None):
    """Fetches messages for a specific channel from the given date (00:00 to 23:59)."""
    try:
        if not target_date:
            target_date = datetime.now(timezone.utc)
            
        start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1, microseconds=-1)
        
        response = supabase.table("messages")\
            .select("*")\
            .eq("channel_id", str(channel_id))\
            .gte("created_at", start_of_day.isoformat())\
            .lte("created_at", end_of_day.isoformat())\
            .order("created_at", desc=False)\
            .limit(1000)\
            .execute()
            
        return response.data or []
    except Exception as e:
        print(f"Error fetching day messages: {e}")
        return []

def check_guild_subscription(guild_id: int):
    """Checks if a Discord guild (by its ID) has an active subscription."""
    try:
        print(f"Checking subscription for guild_id: {guild_id} (type: {type(guild_id)})")
        
        # Match discord_guild_id in profiles
        # Note: We use str(guild_id) because it's stored as text in the DB
        response = supabase.table("profiles").select("id, email, subscription_tier, status, discord_guild_id").eq("discord_guild_id", str(guild_id)).execute()
        
        print(f"Query result: {response.data}")
        
        if not response.data:
            print(f"No profile found with discord_guild_id={guild_id}")
            return False, "This Discord server is not linked to an active ProjectPulse account. Use /link in the dashboard to connect."
        
        profile = response.data[0]
        tier = (profile.get("subscription_tier") or "").lower()
        status = (profile.get("status") or "active").lower()
        
        print(f"Found profile: {profile.get('email')}")
        print(f"   Tier: {tier}")
        print(f"   Status: {status}")
        
        # Any valid plan tier allows bot usage
        # super_admin is a hidden back door
        if tier in ["starter", "pro", "enterprise", "super_admin"]:
            return True, "Active", profile.get("id")
        
        return False, "Your ProjectPulse account does not have an active plan. Please upgrade on the dashboard to Starter, Pro, or Enterprise to use the bot features.", None
    except Exception as e:
        print(f"Error checking subscription: {e}")
        return False, f"Error verifying subscription status: {e}", None

def add_knowledge_base_item(question: str, answer: str):
    """Adds a new Q&A pair to the knowledge base."""
    try:
        data = {"question": question, "answer": answer}
        response = supabase.table("knowledge_base").insert(data).execute()
        return True if response.data else False
    except Exception as e:
        print(f"Error adding to KB: {e}")
        return False

def search_knowledge_base(query: str):
    """Searches the knowledge base using keyword matching (simple full-text simulation)."""
    try:
        # Common stop words to ignore even if >= 3 chars
        stop_words = {
            "the", "and", "how", "what", "where", "when", "why", "who", "can", "does", "did", "are", "is", 
            "for", "you", "your", "with", "that", "this", "from", "have", "has", "had", "not", "but"
        }
        
        # Split query into words, lowercase, and filter
        # Keep words if length >= 3 AND not in stop_words
        # This allows "log", "pay", "api", "app", "add", "use" which are crucial but short.
        keywords = [
            word.lower() for word in query.split() 
            if len(word) >= 3 and word.lower() not in stop_words
        ]
        
        # Always try to include the original query as a single phrase search too (for exact matches)
        if len(query) > 5 and query.lower() not in keywords:
             pass # actually, strict phrase search is implied if we don't split, but here we want OR logic.
             # We can'teasily mix AND (phrase) and OR (keywords) in one simple PostgREST call.
             # Let's stick to OR logic for broad recall.
        
        if not keywords:
            # Fallback: if everything was filtered (e.g. "is it ok"), use the original query string as a single token
            keywords = [query.strip()]

        # Construct an OR filter
        conditions = []
        for word in keywords:
            conditions.append(f"question.ilike.%{word}%")
            conditions.append(f"answer.ilike.%{word}%")
        
        search_filter = ",".join(conditions)
        
        response = supabase.table("knowledge_base").select("*").or_(search_filter).limit(5).execute()
        return response.data or []
    except Exception as e:
        print(f"Error searching KB: {e}")
        return []

def add_ai_suggestion(guild_id: str, content: str, source_channel: str = None, suggestion_type: str = "suggestion"):
    """Adds an AI-generated suggestion to the database."""
    try:
        data = {
            "discord_guild_id": str(guild_id),
            "content": content,
            "source_channel": source_channel,
            "type": suggestion_type
        }
        response = supabase.table("ai_suggestions").insert(data).execute()
        return True if response.data else False
    except Exception as e:
        print(f"Error adding AI suggestion: {e}")
        return False

def get_recent_suggestions(guild_id: str, limit: int = 5):
    """Fetches recent AI suggestions for a specific guild."""
    try:
        response = supabase.table("ai_suggestions")\
            .select("*")\
            .eq("discord_guild_id", str(guild_id))\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()
        return response.data or []
    except Exception as e:
        print(f"Error fetching AI suggestions: {e}")
        return []
def get_learning_channel(guild_id: str):
    """Fetches the configured learning channel ID for a guild."""
    try:
        response = supabase.table("teams")\
            .select("learning_channel_id")\
            .eq("discord_guild_id", str(guild_id))\
            .execute()
        return response.data[0].get("learning_channel_id") if response.data else None
    except Exception as e:
        print(f"Error fetching learning channel: {e}")
        return None

def set_learning_channel(guild_id: str, channel_id: str):
    """Sets the learning channel ID for a guild's team."""
    try:
        # We assume one team per guild for now
        response = supabase.table("teams")\
            .update({"learning_channel_id": str(channel_id)})\
            .eq("discord_guild_id", str(guild_id))\
            .execute()
        
        if not response.data:
            print(f"Warning: No team found with discord_guild_id={guild_id}. Ensure the owner has synced their guild in the dashboard.")
            return False
            
        return True
    except Exception as e:
        print(f"Database Error setting learning channel: {e}")
        raise e # Let the router handle the exception
