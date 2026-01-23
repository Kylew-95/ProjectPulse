import discord
from discord.ext import commands
from services.ai_service import analyze_urgency
from services.supabase_client import insert_message

class Urgency(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_message(self, message):
        # Ignore own messages
        if message.author == self.bot.user:
            return

        # 1. Log every message
        insert_message(message.author.id, message.channel.id, message.content, message.author.name)

        # 2. Urgency Check 
        if len(message.content) > 10: 
            result = analyze_urgency(message.content)
            # Result format: "Score|Reason"
            try:
                score_str, reason = result.split("|", 1)
                score = int(score_str)

                if score >= 7:
                    # A. NOTIFY ADMINS (Private)
                    # Try to find a channel named 'admin-alerts'
                    admin_channel = discord.utils.get(message.guild.channels, name="admin-alerts")
                    
                    # If it doesn't exist, try to create it (requires permissions)
                    if not admin_channel:
                         try:
                             overwrites = {
                                 message.guild.default_role: discord.PermissionOverwrite(read_messages=False),
                                 message.guild.me: discord.PermissionOverwrite(read_messages=True)
                             }
                             admin_channel = await message.guild.create_text_channel('admin-alerts', overwrites=overwrites)
                         except:
                             # Fallback: Just log to console if we can't create channel
                             print("Could not create admin-alerts channel.")

                    if admin_channel:
                        await admin_channel.send(
                            f"🚨 **Urgency Alert (Level {score}/10)**\n"
                            f"**User:** {message.author.mention}\n"
                            f"**Channel:** {message.channel.mention}\n"
                            f"**Reason:** {reason}\n"
                            f"**Content:** {message.content}"
                        )

                    # B. FOLLOW-UP WITH USER (Public Thread or Reply)
                    # We ask follow-up questions to get more info.
                    follow_up = "I noticed you're reporting a critical issue. To help our team fix this faster, could you please provide:\n1. Any error codes you see?\n2. What steps caused this?"
                    
                    await message.reply(follow_up)

            except ValueError:
                pass

async def setup(bot):
    await bot.add_cog(Urgency(bot))
