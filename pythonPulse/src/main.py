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

# Initialize Bot
bot = commands.Bot(command_prefix="!", intents=intents)

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
            owner_profile = supabase.table("profiles").select("id, email, discord_guild_id").eq("id", str(guild.owner_id)).execute()
            
            if owner_profile.data and len(owner_profile.data) > 0:
                profile = owner_profile.data[0]
                # Update the owner's profile with this guild ID
                supabase.table("profiles").update({
                    "discord_guild_id": str(guild.id)
                }).eq("id", str(guild.owner_id)).execute()
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
    config = uvicorn.Config(fastapi_app, host="0.0.0.0", port=8000, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()

async def main():
    # Sync Stripe plan tiers at startup
    try:
        sync_plan_tiers()
    except Exception as e:
        print(f"⚠️ Failed to sync plan tiers on startup: {e}")

    # Auto-start Stripe Listener (Forwarding to local backend)
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
