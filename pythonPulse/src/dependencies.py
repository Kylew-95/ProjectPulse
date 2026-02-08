from fastapi import HTTPException
import os
from dotenv import load_dotenv

load_dotenv()

async def check_enterprise_tier(user_id: str):
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    try:
        from services.supabase_client import supabase
        
        # Use maybe_single() to return None if not found, rather than raising an error
        res = supabase.table("profiles").select("subscription_tier").eq("id", user_id).maybe_single().execute()
        
        if not res.data or res.data.get("subscription_tier") not in ["enterprise", "super_admin"]:
            print(f"Access Denied: User {user_id} tier is {res.data.get('subscription_tier') if res.data else 'none'}", flush=True)
            raise HTTPException(status_code=403, detail="Enterprise tier required for this feature")
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        print(f"Tier Check Error for user {user_id}: {e}", flush=True)
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to verify subscription tier")

async def check_pro_tier(user_id: str):
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    try:
        from services.supabase_client import supabase
        res = supabase.table("profiles").select("subscription_tier").eq("id", user_id).maybe_single().execute()
        
        allowed_tiers = ["pro", "enterprise", "super_admin"]
        if not res.data or res.data.get("subscription_tier") not in allowed_tiers:
            print(f"Access Denied: User {user_id} tier is {res.data.get('subscription_tier') if res.data else 'none'}", flush=True)
            raise HTTPException(status_code=403, detail="Pro or Enterprise tier required for this feature")
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        print(f"Tier Check Error for user {user_id}: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to verify subscription tier")
