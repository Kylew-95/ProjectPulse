import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(dotenv_path='pythonPulse/.env')

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not url or not key:
    print("Missing Config")
    exit()

client = create_client(url, key)

# ID from recent logs
user_id = '225f30f9-9e56-4ff1-8572-90fc173656d3' 

try:
    response = client.table('profiles').select('*').eq('id', user_id).execute()
    if response.data:
        print("--- PROFILE DUMP ---")
        p = response.data[0]
        print(f"ID: {p.get('id')}")
        print(f"Status: {p.get('status')}  <-- CRITICAL")
        print(f"Tier: {p.get('subscription_tier')}")
        print(f"Trial End: {p.get('trial_end')}")
    else:
        print("Profile not found.")
except Exception as e:
    print(f"Error: {e}")
