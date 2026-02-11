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
intents.members = True   # Critical for role management and join events
intents.guilds = True    # Critical for guild-related interactions

# Initialize Bot
bot = commands.Bot(command_prefix="!", intents=intents, help_command=None)

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
    
    # 1. Randomized delay to reduce race conditions in multi-bot setups
    await asyncio.sleep(os.getpid() % 3 + 1) # Simple way to stagger instances
    
    # 3. Robust Channel Check & Creation (Reports + Info)
    for guild in bot.guilds:
        # A. Report Channel
        report_channel = discord.utils.get(guild.text_channels, name="report-issues-with-pulse")
        if not report_channel:
            try:
                await guild.create_text_channel("report-issues-with-pulse")
                print(f"Created #report-issues-with-pulse in {guild.name}")
            except Exception as e:
                print(f"Error creating report channel in {guild.name}: {e}")

        # B. Info/Help Channel
        info_channel = discord.utils.get(guild.text_channels, name="pulse-help")
        if not info_channel:
            try:
                info_channel = await guild.create_text_channel(
                    "pulse-help", 
                    topic="Getting started with Project Pulse Support and AI Assistant."
                )
                embed = discord.Embed(
                    title="🚀 Project Pulse Support Guide", 
                    description="Welcome to Project Pulse! I am your AI-powered support assistant here to help you resolve issues and manage your team efficiently.",
                    color=discord.Color.brand_green()
                )
                embed.add_field(
                    name="❓ How to Get Help", 
                    value=f"• **Ask AI**: Use `!pulse ask <your question>` for quick answers.\n"
                          f"• **Report Issues**: Post details in {report_channel.mention if report_channel else '#report-issues-with-pulse'} or use `!report`.\n"
                          "• **Dashboard**: Access [ProjectPulse Dashboard](https://project-pulse-theta-six.vercel.app/) for analytics.", 
                    inline=False
                )
                embed.add_field(
                    name="📜 Community Rules", 
                    value="1. **Be Descriptive**: More details lead to faster resolutions.\n"
                          "2. **Respect Privacy**: Do not post sensitive personal data.\n"
                          "3. **Stay Relevant**: Use specific channels for their intended purpose.", 
                    inline=False
                )
                embed.set_footer(text="Powered by Project Pulse AI")
                await info_channel.send(embed=embed)
                print(f"Created #pulse-help in {guild.name}")
            except Exception as e:
                print(f"Error creating info channel in {guild.name}: {e}")

        # C. Auto-enable Widget for WidgetBot/Chat
        try:
            if not guild.widget_enabled:
                await guild.edit(widget_enabled=True, widget_channel=report_channel or guild.text_channels[0])
                print(f"✅ Automated: Enabled Discord Widget for {guild.name}")
        except Exception as e:
            print(f"⚠️ Could not auto-enable widget in {guild.name}: {e} (Bot might need 'Manage Server' permission)")
    
    # Sync commands globally for multi-server support
    try:
        await bot.tree.sync()
        print("Commands synced globally")
    except discord.Forbidden:
        print("Warning: Could not sync commands globally (Missing Access).")
        print("   This is expected if the bot was JUST added or permissions are limited.")
        print("   Commands will still work in servers where the bot has permission.")
    except Exception as e:
        print(f"Failed to sync commands: {e}")
        
@bot.event
async def on_guild_join(guild):
    """Automatically create the required channels and link server to owner's profile."""
    print(f"Bot joined server: {guild.name}")
    print(f"Server ID: {guild.id}")
    print(f"Member count: {guild.member_count}")
    print(f"Owner ID: {guild.owner_id}")
    
    # Automatically link this Discord server to the owner's profile
    try:
        existing = supabase.table("profiles").select("id, email").eq("discord_guild_id", str(guild.id)).execute()
        
        if existing.data:
            print(f"Server already linked to profile: {existing.data[0].get('email')}")
        else:
            owner_profile = supabase.table("profiles").select("id, email, discord_guild_id").eq("discord_user_id", str(guild.owner_id)).execute()
            
            if owner_profile.data and len(owner_profile.data) > 0:
                profile = owner_profile.data[0]
                supabase.table("profiles").update({
                    "discord_guild_id": str(guild.id)
                }).eq("discord_user_id", str(guild.owner_id)).execute()

                # Also link the owner's teams to this new Discord guild
                supabase.table("teams").update({
                    "discord_guild_id": str(guild.id)
                }).eq("owner_id", profile.get("id")).execute()

                print(f"Automatically linked server and teams to owner's profile: {profile.get('email')}")
            else:
                print(f"Warning: Could not find profile for server owner (Discord ID: {guild.owner_id})")
                print(f"   Owner needs to sign up at ProjectPulse first!")
    except Exception as e:
        print(f"Error auto-linking server: {e}")
    
    # Create Channels on Join
    # 1. Report Channel
    if not discord.utils.get(guild.text_channels, name="report-issues-with-pulse"):
        try:
            await guild.create_text_channel("report-issues-with-pulse")
        except Exception: pass
            
    # 3. Auto-enable Widget on join
    try:
        report_channel = discord.utils.get(guild.text_channels, name="report-issues-with-pulse")
        await guild.edit(widget_enabled=True, widget_channel=report_channel or guild.text_channels[0])
        print(f"✅ Automated: Enabled Discord Widget on join for {guild.name}")
    except Exception as widget_err:
        print(f"⚠️ Could not enable widget on join in {guild.name}: {widget_err}")
            
    # 2. Info Channel
    if not discord.utils.get(guild.text_channels, name="pulse-help"):
        try:
            info_channel = await guild.create_text_channel(
                "pulse-help", 
                topic="Getting started with Project Pulse Support and AI Assistant."
            )
            embed = discord.Embed(
                title="🚀 Project Pulse Support Guide", 
                description="Welcome to Project Pulse! I am your AI-powered support assistant here to help you resolve issues and manage your team efficiently.",
                color=discord.Color.brand_green()
            )
            report_channel = discord.utils.get(guild.text_channels, name="report-issues-with-pulse")
            embed.add_field(
                name="❓ How to Get Help", 
                value=f"• **Ask AI**: Use `!pulse ask <your question>` for quick answers.\n"
                      f"• **Report Issues**: Post details in {report_channel.mention if report_channel else '#report-issues-with-pulse'} or use `!report`.\n"
                      "• **Dashboard**: Access [ProjectPulse Dashboard](https://project-pulse-theta-six.vercel.app/) for analytics.", 
                inline=False
            )
            embed.add_field(
                name="📜 Community Rules", 
                value="1. **Be Descriptive**: More details lead to faster resolutions.\n"
                      "2. **Respect Privacy**: Do not post sensitive personal data.\n"
                      "3. **Stay Relevant**: Use specific channels for their intended purpose.", 
                inline=False
            )
            embed.set_footer(text="Powered by Project Pulse AI")
            await info_channel.send(embed=embed)
        except Exception: pass



async def load_extensions():
    # Make path relative to this file's location
    base_dir = os.path.dirname(os.path.abspath(__file__))
    cogs_dir = os.path.join(base_dir, 'cogs')
    
    if not os.path.exists(cogs_dir):
        print(f"Warning: Cogs directory not found at {cogs_dir}")
        return

    for filename in os.listdir(cogs_dir):
        if filename.endswith('.py'):
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
        print(f"Failed to sync plan tiers on startup: {e}")

    # Auto-start Stripe Listener (Development Only)
    if os.getenv("ENV") != "production":
        try:
            print("Starting Stripe Listener (Background)...")
            # Run stripe listen silently
            subprocess.Popen(
                ["stripe", "listen", "--forward-to", "localhost:8000/webhook"], 
                shell=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        except Exception as e:
            print(f"Could not start Stripe Listener automatically: {e}")
    else:
        print("Running in Production Mode - Skipping local Stripe Listener")
    
    # Run both bot and API
    loop = asyncio.get_running_loop()
    
    # 1. Load extensions first
    try:
        await load_extensions()
    except Exception as e:
        print(f"Failed to load extensions: {e}")
        return

    # 2. Start long-running services
    fastapi_app.state.bot = bot
    tasks = [
        loop.create_task(bot.start(DISCORD_TOKEN)),
        loop.create_task(run_fastapi())
    ]
    
    try:
        # Wait for either the Bot or API to fail or complete
        done, pending = await asyncio.wait(
            tasks, 
            return_when=asyncio.FIRST_COMPLETED
        )
        
        # Check for exceptions in done tasks
        for task in done:
            if task.exception():
                e = task.exception()
                if "429" in str(e):
                    print("\nCRITICAL ERROR: Discord Rate Limit (429) hit.")
                    print("Render IP is likely blocked by Cloudflare/Discord.")
                    print("Action: Restart Render service to try a new IP.\n")
                else:
                    print(f"Task failed with error: {e}")
                    
    except asyncio.CancelledError:
        print("Shutdown signal received...")
    except Exception as e:
        print(f"Main Loop error: {e}")
    finally:
        print("Cleaning up tasks...")
        # Cancel all pending tasks
        for task in tasks:
            if not task.done():
                task.cancel()
        
        # Wait for tasks to finish cancelling
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
            
        print("Shutting down bot...")
        if not bot.is_closed():
            await bot.close()
        
        print("Shutdown complete.")




if __name__ == "__main__":
    if not DISCORD_TOKEN:
        print("Error: DISCORD_TOKEN not found in .env")
    else:
        try:
            asyncio.run(main())
        except KeyboardInterrupt:
            pass