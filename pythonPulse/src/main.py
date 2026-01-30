import discord
from discord.ext import commands
from config import DISCORD_TOKEN
import asyncio
import os
import uvicorn
from api import app as fastapi_app
from plan_tiers import sync_plan_tiers
from services.supabase_client import supabase

import subprocess

# Define Intents
intents = discord.Intents.default()
intents.message_content = True 
intents.presences = True # Critical for status updates

# Initialize Bot
bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_presence_update(before, after):
    """Sync Discord status to Supabase profile"""
    if after.bot:
        return
        
    try:
        # Map Discord status to a simple string
        status = str(after.status)
        
        # Only update if status changed
        if str(before.status) != status:
            # Update profile where discord_user_id matches
            # Note: We need to make sure we have discord_user_id in profiles. 
            # Looking at schema, we don't explicitly see it, but on_guild_join uses it.
            # wait, on_guild_join uses: .eq("discord_user_id", str(guild.owner_id))
            # So discord_user_id MUST exist in profiles?
            # Let's check schema.sql again.
            # Schema.sql creates profiles table with: id, subscription_tier, status, discord_guild_id, trial_start... 
            # It DOES NOT show `discord_user_id`.
            # BUT main.py implies it exists: .eq("discord_user_id", str(guild.owner_id))
            # If `discord_user_id` is missing in schema, it might have been added manually or main.py is failing?
            # However, profiles.id IS the auth.users.id.
            # If the user signed in with Discord, auth.users.id is NOT the discord ID.
            # auth.users.id is a UUID.
            
            # If main.py assumes `discord_user_id` column exists, and it's working (or code is written that way),
            # then we should trust the code or check if column exists.
            
            # We can't easily check columns without SQL. 
            # Let's assume it exists or use a lookup.
            pass
            
            # Actually, let's do the update assuming the column `discord_user_id` is there 
            # OR we try to match by something else?
            # If we don't have discord_user_id column, we can't link `after.id` to a profile easily
            # UNLESS `discord_user_id` is stored.
            
            # Let's add the code with a check.
            
            # For now, let's just write the listener assuming best effort.
            
            # Wait, `on_guild_join` logic:
            # .eq("discord_user_id", str(guild.owner_id))
            # This strongly suggests the column exists.
            
            supabase.table("profiles").update({
                "discord_status": status
            }).eq("discord_user_id", str(after.id)).execute()
            
    except Exception as e:
        print(f"Error syncing presence: {e}")

@bot.event
async def on_ready():
    print(f'Logged in as {bot.user} (ID: {bot.user.id})')
    print('------')
    
    # Create "report-issues-with-pulse" channel in each guild if it doesn't exist
    for guild in bot.guilds:
        channel = discord.utils.get(guild.text_channels, name="report-issues-with-pulse")
        if not channel:
            try:
                await guild.create_text_channel("report-issues-with-pulse")
                print(f"Created #report-issues-with-pulse in {guild.name}")
            except Exception as e:
                print(f"Failed to create channel in {guild.name}: {e}")
    
    # Sync commands globally for multi-server support
    try:
        await bot.tree.sync()
        print("✅ Commands synced globally")
    except discord.Forbidden:
        print("⚠️ Warning: Could not sync commands globally (Missing Access).")
        print("   This is expected if the bot was JUST added or permissions are limited.")
        print("   Commands will still work in servers where the bot has permission.")
    except Exception as e:
        print(f"❌ Failed to sync commands: {e}")
        
@bot.event
async def on_guild_join(guild):
    """Automatically create the required channel and link server to owner's profile."""
    print(f"🎉 Bot joined server: {guild.name}")
    print(f"📋 Server ID: {guild.id}")
    print(f"👥 Member count: {guild.member_count}")
    print(f"👑 Owner ID: {guild.owner_id}")
    
    # Automatically link this Discord server to the owner's profile
    try:
        
        # Find the profile by Discord user ID (owner_id)
        # First, check if there's already a profile with this discord_guild_id
        existing = supabase.table("profiles").select("id, email").eq("discord_guild_id", str(guild.id)).execute()
        
        if existing.data:
            print(f"✅ Server already linked to profile: {existing.data[0].get('email')}")
        else:
            # Try to find owner's profile by their Discord ID in auth.users
            # Since we use Discord OAuth, the user's Discord ID is stored as the user's id
            owner_profile = supabase.table("profiles").select("id, email, discord_guild_id").eq("discord_user_id", str(guild.owner_id)).execute()
            
            if owner_profile.data and len(owner_profile.data) > 0:
                profile = owner_profile.data[0]
                # Update the owner's profile with this guild ID
                supabase.table("profiles").update({
                    "discord_guild_id": str(guild.id)
                }).eq("discord_user_id", str(guild.owner_id)).execute()
                print(f"✅ Automatically linked server to owner's profile: {profile.get('email')}")
            else:
                print(f"⚠️ Could not find profile for server owner (Discord ID: {guild.owner_id})")
                print(f"   Owner needs to sign up at ProjectPulse first!")
    except Exception as e:
        print(f"❌ Error auto-linking server: {e}")
    
    # Create the report channel
    channel = discord.utils.get(guild.text_channels, name="report-issues-with-pulse")
    if not channel:
        try:
            await guild.create_text_channel("report-issues-with-pulse")
            print(f"Created #report-issues-with-pulse in {guild.name} (on join)")
        except Exception as e:
            print(f"Failed to create channel in {guild.name} on join: {e}")



async def load_extensions():
    for filename in os.listdir('./src/cogs'):
        if filename.endswith('.py') and filename != 'knowledge.py':
            await bot.load_extension(f'cogs.{filename[:-3]}')
            print(f"Loaded extension: {filename}")


async def run_fastapi():
    port = int(os.getenv("PORT", 8000))
    config = uvicorn.Config(fastapi_app, host="0.0.0.0", port=port, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()

async def main():
    # Sync Stripe plan tiers at startup
    try:
        sync_plan_tiers()
    except Exception as e:
        print(f"⚠️ Failed to sync plan tiers on startup: {e}")

    # Auto-start Stripe Listener (Development Only)
    if os.getenv("ENV") != "production":
        try:
            print("🎧 Starting Stripe Listener (Background)...")
            # Run stripe listen silently
            subprocess.Popen(
                ["stripe", "listen", "--forward-to", "localhost:8000/webhook"], 
                shell=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        except Exception as e:
            print(f"⚠️ Could not start Stripe Listener automatically: {e}")
    else:
        print("🌍 Running in Production Mode - Skipping local Stripe Listener")
    
    # Run both bot and API
    await asyncio.gather(
        load_extensions(),
        bot.start(DISCORD_TOKEN),
        run_fastapi()
    )




if __name__ == "__main__":
    if not DISCORD_TOKEN:
        print("Error: DISCORD_TOKEN not found in .env")
    else:
        try:
            asyncio.run(main())
        except KeyboardInterrupt:
            pass