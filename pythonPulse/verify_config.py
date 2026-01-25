import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

URL = os.getenv("SUPABASE_URL")
# Robust Key Loading: Try Service Role first, then generic Key
service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
anon_key = os.getenv("SUPABASE_KEY")

print(f"DEBUG: Found SUPABASE_SERVICE_ROLE_KEY? {'Yes' if service_key else 'No'}")
print(f"DEBUG: Found SUPABASE_KEY? {'Yes' if anon_key else 'No'}")

key = service_key or anon_key

if not key:
    print("❌ ERROR: No Key found in .env")
    exit(1)

print(f"Testing Key starting with: {key[:10]}...") 

try:
    supabase: Client = create_client(URL, key)
    
    # Try to update a profile to check Write Permissions (Bypass RLS)
    USER_ID = 'a21eadf1-83f8-4c28-a1bb-c0322539ae5c' 
    
    print(f"Attempting to update profile for {USER_ID}...")
    
    data = {"updated_at": "now()"}
    
    response = supabase.table('profiles').upsert({'id': USER_ID, **data}).execute()
    
    print("✅ SUCCESS! The Key allows writing to the database.")
    print("Current Profile Data:", response.data)
    
except Exception as e:
    print("\n❌ FAILED. The Key is likely the PUBLIC/ANON Key (RLS Blocked).")
    print("Error details:", e)
