from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from services.supabase_client import set_learning_channel
import discord

router = APIRouter()

@router.get("/test")
async def discord_test():
    return {"status": "discord_router_online"}

class LearningChannelUpdate(BaseModel):
    guild_id: str
    channel_id: str

@router.get("/channels/{guild_id}")
async def get_guild_channels(guild_id: str, request: Request):
    """Fetches text channels for a specific guild via the Discord bot."""
    bot = getattr(request.app.state, "bot", None)
    if not bot:
        raise HTTPException(status_code=503, detail="Discord bot is not running")

    try:
        guild = bot.get_guild(int(guild_id))
        if not guild:
            # Try fetching if not in cache
            guild = await bot.fetch_guild(int(guild_id))
        
        if not guild:
            raise HTTPException(status_code=404, detail="Guild not found or bot not in guild")

        channels = [
            {"id": str(ch.id), "name": ch.name} 
            for ch in guild.text_channels 
            if isinstance(ch, discord.TextChannel)
        ]
        return {"channels": channels}
    except Exception as e:
        print(f"Error fetching Discord channels: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/learning-channel")
async def update_learning_channel(data: LearningChannelUpdate):
    """Updates the learning channel ID for a guild's team."""
    try:
        success = set_learning_channel(data.guild_id, data.channel_id)
        if not success:
            raise HTTPException(
                status_code=404, 
                detail="No team found linked to this Discord server. Please go to the ProjectPulse Dashboard and click 'Sync Discord' to link your team."
            )
        return {"status": "success", "message": "Learning channel updated"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Learning Channel Error: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred while updating the learning channel.")

class SyncGuildRequest(BaseModel):
    user_id: str

@router.post("/sync-guild")
async def sync_guild(data: SyncGuildRequest, request: Request):
    """Manually sync user's Discord guild to their profile."""
    bot = getattr(request.app.state, "bot", None)
    if not bot:
        raise HTTPException(status_code=503, detail="Discord bot is not running")
    
    try:
        from services.supabase_client import supabase
        
        # Get the user's profile to find their Discord Snowflake ID
        profile_res = supabase.table("profiles").select("discord_user_id").eq("id", data.user_id).execute()
        
        discord_uid = None
        if profile_res.data:
            discord_uid = profile_res.data[0].get("discord_user_id")
            
        if not discord_uid:
            # If we don't know their Discord ID, we can't search bot guilds by owner
            raise HTTPException(
                status_code=400, 
                detail="Your Discord account is not linked to your profile. Please add the bot to your server first, or use a Discord command to link your account."
            )
        
        # Find all guilds where the bot is present
        user_owned_guild = None
        for guild in bot.guilds:
            # Check if this user is the owner using the Discord Snowflake ID
            if str(guild.owner_id) == str(discord_uid):
                user_owned_guild = guild
                break
        
        if not user_owned_guild:
            raise HTTPException(status_code=404, detail="No Discord server found where you are the owner and the bot is present")
        
        # Update the user's profile with the guild_id
        result = supabase.table("profiles").update({
            "discord_guild_id": str(user_owned_guild.id)
        }).eq("id", data.user_id).execute()
        
        # Also link the user's teams to this Discord guild
        supabase.table("teams").update({
            "discord_guild_id": str(user_owned_guild.id)
        }).eq("owner_id", data.user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update profile")
        
        return {
            "status": "success", 
            "message": f"Successfully linked to {user_owned_guild.name}",
            "guild_id": str(user_owned_guild.id),
            "guild_name": user_owned_guild.name
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error syncing guild: {e}")
        raise HTTPException(status_code=500, detail=str(e))

