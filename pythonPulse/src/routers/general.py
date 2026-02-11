from fastapi import APIRouter, HTTPException, Request
from rate_limiter import limiter
import os

router = APIRouter()

@router.post("/send-invite")
@limiter.limit("10/minute")
async def send_invite(request: Request, data: dict):
    # Retrieve email from request
    email = data.get("email")
    role = data.get("role", "member")
    team_id = data.get("team_id")
    discord_id = data.get("discord_id") # Optional: if they provided a Discord Snowflake directly

    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    print(f"DEBUG: Sending invite to {email} as {role} for team {team_id}", flush=True)

    # 1. Get Team & Discord Guild Info
    from services.supabase_client import supabase
    team_res = supabase.table("teams").select("name, discord_guild_id").eq("id", team_id).single().execute()
    if not team_res.data:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team_name = team_res.data.get("name")
    guild_id = team_res.data.get("discord_guild_id")

    # 2. Generate Discord Invite Link (if guild linked)
    invite_link = "https://projectpulse.app/join" # Fallback
    if guild_id:
        bot = getattr(request.app.state, "bot", None)
        if bot:
            try:
                guild = bot.get_guild(int(guild_id))
                if not guild:
                    guild = await bot.fetch_guild(int(guild_id))
                
                if guild:
                    # Find a text channel to invite to
                    target_channel = guild.text_channels[0]
                    invite = await target_channel.create_invite(max_age=86400, max_uses=1, unique=True)
                    invite_link = invite.url
                    print(f"Generated Discord Invite: {invite_link}")
            except Exception as e:
                print(f"Warning: Failed to generate Discord invite: {e}")

    # 3. Create/Update team_member record as 'inactive'
    try:
        # Check if already a member or invited
        existing = supabase.table("team_members") \
            .select("id") \
            .eq("team_id", team_id) \
            .eq("email", email) \
            .execute()
        
        member_data = {
            "team_id": team_id,
            "email": email,
            "role": role,
            "status": "inactive",
            "discord_id": discord_id
        }

        if existing.data:
            supabase.table("team_members").update(member_data).eq("id", existing.data[0]["id"]).execute()
        else:
            supabase.table("team_members").insert(member_data).execute()
    except Exception as e:
        print(f"Error updating team_members for invite: {e}")

    # 4. Send the actual email
    from services.mail_service import send_invitation_email
    success = send_invitation_email(email, team_name, role, invite_link)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to send invitation email")

    return {"status": "success", "message": f"Invite sent successfully to {email}"}

