import discord
from discord.ext import commands
from services.supabase_client import add_knowledge_base_item, search_knowledge_base, check_guild_subscription
from services.ai_service import generate_kb_answer
import asyncio

class Knowledge(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    async def cog_check(self, ctx):
        """Global check for this cog: verify subscription."""
        if not ctx.guild:
            return True # Allow DMs if any
        
        is_active, sub_msg, _ = await asyncio.to_thread(check_guild_subscription, ctx.guild.id)
        if not is_active:
            await ctx.send(f"**Subscription Required**: {sub_msg}")
            return False
        return True

    @commands.group(invoke_without_command=True)
    async def pulse(self, ctx):
        await ctx.send("Usage: !pulse add <question> | <answer> OR !pulse ask <query>")

    @pulse.command(name="add")
    async def add_entry(self, ctx, *, content: str):
        """Adds a Q&A pair. Usage: !pulse add How do I login? | Go to the login page."""
        try:
            if "|" not in content:
                 await ctx.send("Format error. Usage: `!pulse add Question | Answer`")
                 return
                 
            question, answer = content.split("|", 1)
            success = await asyncio.to_thread(add_knowledge_base_item, question.strip(), answer.strip())
            if success:
                await ctx.send(f"Added to KB: **{question.strip()}**")
            else:
                await ctx.send("Failed to add to database.")
        except ValueError:
            await ctx.send("Format error. Usage: `!pulse add Question | Answer`")

    @pulse.command(name="ask")
    async def ask_entry(self, ctx, *, query: str):
        """Asks the AI a question using the Knowledge Base. Usage: !pulse ask How do I login?"""
        
        # 1. Search for relevant context
        results = await asyncio.to_thread(search_knowledge_base, query)
        
        if not results:
            await ctx.send("I couldn't find any relevant topics in our Knowledge Base. You might want to open a ticket with `!ticket create`.")
            return

        # 2. Prepare Context for AI
        context_str = "\n".join([f"Q: {item['question']}\nA: {item['answer']}" for item in results[:3]])
        
        # 3. Generate Answer
        async with ctx.typing():
            ai_response = await asyncio.to_thread(generate_kb_answer, query, context_str)
            
        # 4. Reply
        embed = discord.Embed(
            title="Project Pulse AI Assistant",
            description=ai_response,
            color=discord.Color.blue()
        )
        embed.set_footer(text=f"Based on {len(results[:3])} relevant articles")
        await ctx.send(embed=embed)

async def setup(bot):
    await bot.add_cog(Knowledge(bot))
