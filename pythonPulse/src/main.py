import discord
from discord.ext import commands
from config import DISCORD_TOKEN, GUILD_ID
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
    
    if GUILD_ID:
        try:
            guild = discord.Object(id=GUILD_ID)
            bot.tree.copy_global_to(guild=guild)
            await bot.tree.sync(guild=guild)
            print(f"Commands synced to Guild ID: {GUILD_ID}")
        except Exception as e:
            print(f"Failed to sync commands: {e}")

async def load_extensions():
    for filename in os.listdir('./src/cogs'):
        if filename.endswith('.py'):
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
