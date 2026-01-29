
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Add src to path to allow imports if needed, though we use direct lib usage here
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

def create_ticket():
    load_dotenv()
    
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        print("Error: Supabase credentials not found.")
        return

    supabase = create_client(url, key)

    ticket_data = {
        "title": "User unable to log in to website, consistently receiving 404 error on localhost using Edge browser",
        "description": "User report: 'local host edge on my pc and it happens all the time'. Consistently receiving 404 error on login endpoint.",
        "type": "Bug",
        "priority": "high", # Lowercase to match dropdowns usually
        "location": "Login Page",
        "solution": "1. Verify if the issue is specific to the user's local environment or a broader issue.\n2. Check server logs for 404 errors related to the login endpoint.\n3. Test login functionality on localhost using Edge browser in a controlled environment.\n4. Inspect network requests to identify any missing resources or misconfigured routes.",
        "status": "open",
        # Extra fields from report
        "urgency_score": 7,
        "origin_channel_id": "1466183140736241706"
    }

    print("Attempting to insert ticket with all fields...")
    try:
        data = supabase.table("tickets").insert(ticket_data).execute()
        print("✅ Ticket created successfully with all fields!")
        print(data)
    except Exception as e:
        print(f"⚠️ Failed to insert with extra fields: {e}")
        print("Retrying without extra fields...")
        
        # Remove extra fields
        del ticket_data["urgency_score"]
        del ticket_data["origin_channel_id"]
        
        try:
            data = supabase.table("tickets").insert(ticket_data).execute()
            print("✅ Ticket created successfully (standard fields only)!")
            print(data)
        except Exception as e2:
             print(f"❌ Failed to insert ticket: {e2}")

if __name__ == "__main__":
    create_ticket()
