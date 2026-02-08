import discord
from discord.ext import commands
from services.supabase_client import (
    add_knowledge_base_item, 
    search_knowledge_base, 
    check_guild_subscription, 
    set_learning_channel,
    add_ai_suggestion, 
    get_recent_suggestions
)
from services.ai_service import generate_kb_answer, generate_suggestions_from_logs
import asyncio

class Intelligence(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    async def cog_check(self, ctx):
        """Global check for this cog: verify subscription."""
        if not ctx.guild:
            return True if ctx.command.name in ['add', 'ask'] else False
        
        is_active, sub_msg, _ = await asyncio.to_thread(check_guild_subscription, ctx.guild.id)
        if not is_active:
            if ctx.command.name in ['add', 'ask']: # Knowledge subcommands might be useful in DMs or for admins even with issues
                 pass # Fall through if needed OR:
            await ctx.send(f"**Subscription Required**: {sub_msg}")
            return False
        return True

    @commands.group(name="pulse", invoke_without_command=True)
    async def pulse(self, ctx):
        """Top-level command for ProjectPulse Intelligence features."""
        help_text = (
            "**ProjectPulse Intelligence Commands**\n"
            "• `!pulse ask <query>` - Answer questions from the Knowledge Base\n"
            "• `!pulse learn [channel]` - Analyze history to generate new insights\n"
            "• `!pulse suggestions` - View recent AI insights for this server\n"
            "• `!pulse add <Q> | <A>` - Manually add to Knowledge Base\n"
            "• `!pulse sync_info <text>` - Extract KB articles from a block of text\n"
            "• `!pulse set_learning_channel [#channel]` - Enable auto-learning"
        )
        await ctx.send(help_text)

    # --- Knowledge Subcommands ---

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
        results = await asyncio.to_thread(search_knowledge_base, query)
        
        if not results:
            await ctx.send("I couldn't find any relevant topics in our Knowledge Base. You might want to open a ticket with `!ticket create`.")
            return

        context_str = "\n".join([f"Q: {item['question']}\nA: {item['answer']}" for item in results[:3]])
        
        async with ctx.typing():
            ai_response = await asyncio.to_thread(generate_kb_answer, query, context_str)
            
        embed = discord.Embed(
            title="Project Pulse AI Assistant",
            description=ai_response,
            color=discord.Color.blue()
        )
        embed.set_footer(text=f"Based on {len(results[:3])} relevant articles")
        await ctx.send(embed=embed)

    @pulse.command(name="sync_info")
    async def sync_company_info(self, ctx, *, info: str):
        """Syncs a block of company info (mission, etc.) to the KB. Usage: !pulse sync_info <text>"""
        await ctx.send("⏳ Processing company intelligence and updating Knowledge Base...")
        
        async with ctx.typing():
            from services.ai_service import process_company_info
            qa_pairs = await asyncio.to_thread(process_company_info, info)
            
            if not qa_pairs:
                await ctx.send("I couldn't extract any specific Q&A pairs from that text. Please ensure it contains factual info.")
                return

            count = 0
            for item in qa_pairs:
                success = await asyncio.to_thread(add_knowledge_base_item, item['question'], item['answer'])
                if success:
                    count += 1
            
            await ctx.send(f"✅ Intelligence Sync Complete! Added **{count}** new entries to your Knowledge Base.")

    @pulse.command(name="set_learning_channel")
    async def set_learning(self, ctx, channel: discord.TextChannel = None):
        """Sets the channel for automated AI learning. Usage: !pulse set_learning_channel [#channel]"""
        target_channel = channel or ctx.channel
        
        success = await asyncio.to_thread(set_learning_channel, ctx.guild.id, target_channel.id)
        if success:
            await ctx.send(f"✅ **Automated Learning Enabled**: I will now automatically learn from conversations in {target_channel.mention} every day.")
        else:
            await ctx.send("❌ Failed to update the learning channel in the database. Please ensure your server is linked to a ProjectPulse team.")

    # --- Suggestions Subcommands ---

    @pulse.command(name="learn")
    async def learn_channel(self, ctx, channel: discord.TextChannel = None):
        """Analyzes channel history to generate AI suggestions. Usage: !pulse learn #general"""
        channel = channel or ctx.channel
        
        await ctx.send(f"🔍 Analyzing #{channel.name} history to learn about company needs...")
        
        async with ctx.typing():
            messages = []
            async for msg in channel.history(limit=100):
                if not msg.author.bot:
                    messages.append(f"{msg.author.display_name}: {msg.content}")
            
            if not messages:
                await ctx.send("No recent non-bot messages found to learn from.")
                return

            text_block = "\n".join(messages[::-1])

            suggestions = await asyncio.to_thread(generate_suggestions_from_logs, text_block)

            if not suggestions:
                await ctx.send("I analyzed the chat but didn't find any specific needs or feature requests this time.")
                return

            count = 0
            for sug in suggestions:
                success = await asyncio.to_thread(
                    add_ai_suggestion, 
                    str(ctx.guild.id), 
                    sug['content'], 
                    channel.name, 
                    sug['type']
                )
                if success:
                    count += 1

            await ctx.send(f"✅ Learning complete! I've generated and saved **{count}** new suggestions for your dashboard.")

    @pulse.command(name="suggestions")
    async def view_suggestions(self, ctx):
        """Displays recent AI suggestions for the server."""
        suggestions = await asyncio.to_thread(get_recent_suggestions, ctx.guild.id)
        
        if not suggestions:
            await ctx.send("No suggestions found. Try running `!pulse learn` first!")
            return

        embed = discord.Embed(
            title="💡 AI Insights & Suggestions",
            description="Based on recent Discord conversations:",
            color=discord.Color.gold()
        )
        
        for sug in suggestions:
            type_emoji = "🚀" if sug['type'] == 'feature_request' else "🛡️" if sug['type'] == 'user_need' else "💡"
            embed.add_field(
                name=f"{type_emoji} {sug['type'].replace('_', ' ').title()}",
                value=sug['content'],
                inline=False
            )
            
        embed.set_footer(text="View full details on your ProjectPulse Dashboard.")
        await ctx.send(embed=embed)

async def setup(bot):
    await bot.add_cog(Intelligence(bot))
