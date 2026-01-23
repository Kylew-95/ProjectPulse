import discord
from discord.ext import commands
from services.supabase_client import add_knowledge_base_item, search_knowledge_base

class Knowledge(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.group(invoke_without_command=True)
    async def kb(self, ctx):
        await ctx.send("Usage: !kb add <question> | <answer> OR !kb ask <query>")

    @kb.command(name="add")
    async def add_entry(self, ctx, *, content: str):
        """Adds a Q&A pair. Usage: !kb add How do I login? | Go to the login page."""
        try:
            question, answer = content.split("|", 1)
            success = add_knowledge_base_item(question.strip(), answer.strip())
            if success:
                await ctx.send(f"✅ Added to KB: **{question.strip()}**")
            else:
                await ctx.send("❌ Failed to add to database.")
        except ValueError:
            await ctx.send("⚠️ Format error. Usage: `!kb add Question | Answer`")

    @kb.command(name="ask")
    async def ask_entry(self, ctx, *, query: str):
        """Searches the KB. Usage: !kb ask login"""
        results = search_knowledge_base(query)
        
        if not results:
            await ctx.send("No matches found in Knowledge Base.")
            return

        response = "**Running Search...**\n"
        for item in results[:3]: # Top 3
            response += f"❓ **Q:** {item['question']}\n💡 **A:** {item['answer']}\n\n"
            
        await ctx.send(response)

async def setup(bot):
    await bot.add_cog(Knowledge(bot))
