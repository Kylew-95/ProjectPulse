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


