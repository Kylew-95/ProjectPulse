import discord
from discord.ext import commands
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from services.supabase_client import get_messages_last_24h, check_guild_subscription, add_ai_suggestion, get_learning_channel, get_messages_from_channel, get_day_messages
from services.ai_service import generate_summary, generate_suggestions_from_logs, generate_daily_insight
import os

class Summary(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.scheduler = AsyncIOScheduler()
        
        # Schedule the job to run at the end of every day (23:55 server time)
        print(f"DEBUG: Starting Daily Pulse scheduler on Instance (PID: {os.getpid()})")
        self.scheduler.add_job(self.post_daily_summary, 'cron', hour=23, minute=55)
        self.scheduler.start()

    async def post_daily_summary(self, target_guild_id=None):
        print("DEBUG: Checking guilds for Daily Pulse...")
        
        guilds_to_process = [self.bot.get_guild(target_guild_id)] if target_guild_id else self.bot.guilds
        
        for guild in guilds_to_process:
            if not guild: 
                print(f"DEBUG: Guild {target_guild_id} not found.")
                continue
            
            # Plan Tier Enforcement
            is_active, _, _ = check_guild_subscription(guild.id)
            if not is_active:
                print(f"DEBUG: Guild {guild.name} ({guild.id}) not active or subscribed.")
                continue

            target_channel = discord.utils.get(guild.channels, name='general')
            if not target_channel:
                print(f"DEBUG: 'general' channel not found in {guild.name}.")
                continue

            print(f"DEBUG: Generating Daily Pulse for {guild.name}...")
            
            # 1. Fetch Logs (Prioritize the learning channel if configured)
            learning_channel_id = get_learning_channel(guild.id)
            print(f"DEBUG: Learning Channel ID: {learning_channel_id}")
            
            messages = []
            if learning_channel_id:
                print(f"DEBUG: Using configured learning channel {learning_channel_id} for {guild.name}")
                # Fetch full day history from DB (00:00 - 23:59)
                messages = get_day_messages(learning_channel_id)
                print(f"DEBUG: Fetched {len(messages)} messages from DB for today.")
            else:
                print(f"DEBUG: No learning channel configured for {guild.name}. Falling back to 24h history.")
                messages = get_messages_last_24h(guild_id=guild.id)
                print(f"DEBUG: Fetched {len(messages)} messages from last 24h.")
            
            if not messages:
                print(f"DEBUG: No messages found for {guild.name}. Skipping AI analysis.")
                continue

            # Format for AI
            text_block = "\n".join([f"{m['username']}: {m['content']}" for m in messages])

            # 2. Generate Summary (General Chat Overview)
            summary = generate_summary(text_block)

            # 3. Generate Daily Strategic Insight
            print("DEBUG: Asking AI for Daily Insight...")
            insight = generate_daily_insight(text_block)
            
            if insight:
                print(f"DEBUG: Insight Generated: {insight['content']}")
                # Store it
                success = add_ai_suggestion(
                    guild_id=str(guild.id),
                    content=insight['content'],
                    source_channel="daily_insight_job",
                    suggestion_type=insight['type']
                )
                if success:
                    print("DEBUG: Insight successfully saved to DB.")
                else:
                    print("ERROR: Failed to save insight to DB.")
            else:
                print("DEBUG: No insight returned by AI.")

            print(f"DEBUG: Daily Pulse completed for {guild.name}.")

    @commands.command(hidden=True)
    @commands.has_permissions(administrator=True)
    async def force_summary(self, ctx):
        """(Admin Only) Manually triggers the Daily Pulse logic for this server."""
        if not ctx.guild:
            return

        is_active, sub_msg, _ = check_guild_subscription(ctx.guild.id)
        if not is_active:
            print(f"DEBUG: Force summary failed - subscription invalid: {sub_msg}")
            return

        print(f"DEBUG: Force summary triggered by {ctx.author} for guild {ctx.guild.name}")
        await ctx.send("Starting manual Daily Pulse trace... (Check terminal/dashboard. No reply here.)", delete_after=5)
        await self.post_daily_summary(target_guild_id=ctx.guild.id)


async def setup(bot):
    await bot.add_cog(Summary(bot))
