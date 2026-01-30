from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY

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
        tier = profile.get("subscription_tier", "free").lower()
        status = profile.get("status", "active").lower() # Default to active if status is missing but tier is set
        
        print(f"Found profile: {profile.get('email')}")
        print(f"   Tier: {tier}")
        print(f"   Status: {status}")
        
        if tier in ["pro", "enterprise"]:
            return True, "Active"
        
        return False, "Your ProjectPulse plan (Free) does not include Daily Pulse summaries. Please upgrade to Pro."
    except Exception as e:
        print(f"Error checking subscription: {e}")
        return False, f"Error verifying subscription status: {e}"
