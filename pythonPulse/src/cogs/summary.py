import discord
from discord.ext import commands
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from services.supabase_client import get_messages_last_24h, check_guild_subscription
from services.ai_service import generate_summary
import os

class Summary(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.scheduler = AsyncIOScheduler()
        
        # Schedule the job to run every day at 9 AM (server time)
        # For testing, you can change this to run every minute: trigger='interval', minutes=1
        self.scheduler.add_job(self.post_daily_summary, 'cron', hour=9, minute=0)
        self.scheduler.start()

    async def post_daily_summary(self):
        print("🔍 Checking guilds for Daily Pulse...")
        
        for guild in self.bot.guilds:
            # Plan Tier Enforcement
            is_active, _ = check_guild_subscription(guild.id)
            if not is_active:
                continue

            target_channel = discord.utils.get(guild.channels, name='general')
            if not target_channel:
                continue

            print(f"📊 Generating Daily Pulse for {guild.name}...")
            
            # 1. Fetch Logs (This needs to be filtered by channel_id or guild if multi-tenant)
            # For now, it fetches last 24h of all logs, which is fine for a start if it's one guild
            messages = get_messages_last_24h()
            
            if not messages:
                await target_channel.send("📉 **The Daily Pulse**: No messages recorded in the last 24 hours.")
                continue

            # Format for AI
            text_block = "\n".join([f"{m['username']}: {m['content']}" for m in messages])

            # 2. Generate Summary
            summary = generate_summary(text_block)

            # 3. Post
            msg = f"""
            📊 **The Daily Pulse: Executive Summary**
            
            {summary}
            """
            await target_channel.send(msg)

    @commands.command()
    async def force_summary(self, ctx):
        """Manually triggers the daily summary for testing."""
        if not ctx.guild:
            return

        is_active, sub_msg = check_guild_subscription(ctx.guild.id)
        if not is_active:
            await ctx.send(f"⚠️ **Subscription Required**: {sub_msg}")
            return

        await ctx.send("Generating summary manually...")
        await self.post_daily_summary()

async def setup(bot):
    await bot.add_cog(Summary(bot))
