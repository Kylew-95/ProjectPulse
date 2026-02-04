from fastapi import APIRouter, HTTPException
import os

router = APIRouter()

@router.post("/send-invite")
async def send_invite(data: dict):
    # Retrieve email from request
    email = data.get("email")
    role = data.get("role", "member")

    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    print(f"Sending invite to {email} as {role}...", flush=True)

    # In a real app, this would use an email service (SendGrid, SES, etc.)
    # Here we mock it or use Supabase Invite User logic if applicable.
    
    # 1. OPTIONAL: Create invite in Supabase Auth (if using Supabase Auth Invites)
    try:
        from supabase import create_client
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
        supabase = create_client(url, key)
        
        # This sends an official Supabase Auth magic link invite
        # res = supabase.auth.admin.invite_user_by_email(email)
        # print(f"Supabase Invite Result: {res}", flush=True)
    except Exception as e:
        print(f"Warning: Failed to create Supabase Auth invite: {e}")

    return {"status": "success", "message": f"Invite sent to {email}"}
