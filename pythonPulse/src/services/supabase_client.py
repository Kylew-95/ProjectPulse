from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def insert_message(user_id: int, channel_id: int, content: str, username: str, full_name: str = None, avatar_url: str = None):
    """Logs a message to the database for summary generation."""
    try:
        data = {
            "user_id": str(user_id),
            "channel_id": str(channel_id),
            "content": content,
            "username": username,
            "full_name": full_name,
            "avatar_url": avatar_url
        }
        supabase.table("messages").insert(data).execute()
    except Exception as e:
        print(f"Error logging message to Supabase: {e}")

def get_messages_last_24h():
    """Fetches messages from the last 24 hours."""
    # Note: In a real app, you'd filter by timestamp. 
    # For simplicity, we just fetch the last 100 messages for now.
    try:
        response = supabase.table("messages").select("*").order("created_at", desc=True).limit(200).execute()
        return response.data
    except Exception as e:
        print(f"Error fetching messages: {e}")
        return []

def check_guild_subscription(guild_id: int):
    """Checks if a Discord guild (by its ID) has an active subscription."""
    try:
        # Match discord_guild_id in profiles
        # Note: We use str(guild_id) because it's stored as text in the DB
        response = supabase.table("profiles").select("subscription_tier, status").eq("discord_guild_id", str(guild_id)).execute()
        
        if not response.data:
            return False, "This Discord server is not linked to an active ProjectPulse account. Use /link in the dashboard to connect."
        
        profile = response.data[0]
        tier = profile.get("subscription_tier", "free").lower()
        status = profile.get("status", "active").lower() # Default to active if status is missing but tier is set
        
        if tier in ["pro", "enterprise"]:
            return True, "Active"
        
        return False, "Your ProjectPulse plan (Free) does not include Daily Pulse summaries. Please upgrade to Pro."
    except Exception as e:
        print(f"Error checking subscription: {e}")
        return False, f"Error verifying subscription status: {e}"


