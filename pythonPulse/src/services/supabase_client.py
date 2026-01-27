from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def insert_message(user_id: int, channel_id: int, content: str, username: str):
    """Logs a message to the database for summary generation."""
    try:
        data = {
            "user_id": str(user_id),
            "channel_id": str(channel_id),
            "content": content,
            "username": username
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

def add_knowledge_base_item(question: str, answer: str):
    try:
        data = {
            "question": question,
            "answer": answer
        }
        supabase.table("knowledge_base").insert(data).execute()
        return True
    except Exception as e:
        print(f"Error adding to KB: {e}")
        return False

def search_knowledge_base(query: str):
    # This sends a text search query to Supabase
    try:
        # Simple text search (requires text search setup in Postgres, 
        # but filtering is easier for a basic start)
        response = supabase.table("knowledge_base").select("*").ilike("question", f"%{query}%").execute()
        return response.data
    except Exception as e:
        print(f"Error searching KB: {e}")
        return []

def check_guild_subscription(guild_id: int):
    """Checks if the guild has a registered profile with a paid tier."""
    try:
        response = supabase.table("profiles") \
            .select("subscription_tier, status") \
            .eq("discord_guild_id", str(guild_id)) \
            .execute()
        
        if not response.data:
            return False, "This workspace is not yet registered with Project Pulse. Please sign up on our website and choose a plan!"

        profile = response.data[0]
        tier = (profile.get("subscription_tier") or "").lower()
        status = profile.get("status")

        # Strict paid-only check
        paid_tiers = ['starter', 'pro', 'enterprise']
        
        if tier in paid_tiers and status in ["active", "trialing"]:
            return True, "Registered"
        
        if tier not in paid_tiers:
            return False, "This feature requires a paid subscription (Starter, Pro, or Enterprise). Please upgrade on our website!"
            
        return False, f"Your workspace status is currently '{status}'. Please ensure your account is in good standing to use the bot."
    except Exception as e:
        print(f"Error checking guild subscription: {e}")
        return False, "Error verifying workspace status."
