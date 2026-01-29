import discord
from discord.ext import commands
from config import DISCORD_TOKEN
import asyncio
import os
import uvicorn
from api import app as fastapi_app
from plan_tiers import sync_plan_tiers

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
    
    # Create "report-an-issue" channel in each guild if it doesn't exist
    for guild in bot.guilds:
        channel = discord.utils.get(guild.text_channels, name="report-an-issue")
        if not channel:
            try:
                await guild.create_text_channel("report-an-issue")
                print(f"Created #report-an-issue in {guild.name}")
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
    """Automatically create the required channel when joining a new server."""
    channel = discord.utils.get(guild.text_channels, name="report-an-issue")
    if not channel:
        try:
            await guild.create_text_channel("report-an-issue")
            print(f"Created #report-an-issue in {guild.name} (on join)")
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
