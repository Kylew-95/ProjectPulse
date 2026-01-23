import discord
from discord.ext import commands
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from services.supabase_client import get_messages_last_24h
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
        # Find the target channel
        # For now, we'll try to find a channel named 'general' or 'updates'
        # In production, put CHANNEL_ID in .env
        target_channel = discord.utils.get(self.bot.get_all_channels(), name='general')
        
        if not target_channel:
            print("Summary Error: Could not find 'general' channel to post summary.")
            return

        print("Generating Daily Pulse...")
        
        # 1. Fetch Logs
        messages = get_messages_last_24h()
        
        if not messages:
            await target_channel.send("📉 **The Daily Pulse**: No messages recorded in the last 24 hours.")
            return

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
        await ctx.send("Generating summary manually...")
        await self.post_daily_summary()

async def setup(bot):
    await bot.add_cog(Summary(bot))
