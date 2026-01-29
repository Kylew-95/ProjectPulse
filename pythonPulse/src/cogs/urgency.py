import discord
from discord.ext import commands
from services.ai_service import analyze_urgency, generate_followup_questions, generate_detailed_ticket
from services.supabase_client import insert_message, check_guild_subscription
from services.ticket_service import get_ticket_service
import json

class Urgency(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.active_reports = {}
        self.ticket_service = get_ticket_service()
        self.notified_guilds = set() # Simple anti-spam for no-tier message

    @commands.Cog.listener()
    async def on_message(self, message):
        # Ignore own messages
        if message.author == self.bot.user:
            return

        # ---------------------------------------------------------
        # 1. HANDLE DM RESPONSES (The "Finish" Step) - NO TIER CHECK FOR DMs 
        # (They are finishing a report already validated by server check)
        # ---------------------------------------------------------
        if isinstance(message.channel, discord.DMChannel):
            if message.author.id in self.active_reports:
                # ... (rest of DM logic remains same)
                # Retrieve the original issue data
                original_data = self.active_reports.pop(message.author.id)
                
                # Generate Structured AI Report
                ai_report = generate_detailed_ticket(original_data['content'], message.content)
                
                # Construct the JSON summary
                report = {
                    "user": message.author.name,
                    "full_name": message.author.display_name,
                    "avatar_url": str(message.author.display_avatar.url),
                    "user_id": str(message.author.id),
                    "original_issue": original_data['content'],
                    "follow_up_details": message.content,
                    "summary": ai_report.get("summary", "New report from Discord"),
                    "type": ai_report.get("type", "Support"),
                    "priority": ai_report.get("priority", "Medium"),
                    "location": ai_report.get("location", "Unknown"),
                    "solution": ai_report.get("solution", "Investigate conversation logs."),
                    "urgency_score": original_data['score'],
                    "origin_channel_id": str(original_data['channel_id']),
                    "status": "OPEN"
                }


                # CREATE TICKET via Integration
                ticket_result = self.ticket_service.create_ticket(report)

                # PRINT JSON TO TERMINAL
                print("\n" + "="*50)
                print(f"📝 FINAL ISSUE REPORT ({ticket_result})")
                print("="*50)
                print(json.dumps(report, indent=4))
                print("="*50 + "\n")

                # Thank the user with a more detailed confirmation
                await message.channel.send(
                    f"✅ **Report Submitted!**\n\n"
                    f"**Summary:** {report['summary']}\n"
                    f"**Priority:** {report['priority']}\n"
                    f"**Type:** {report['type']}\n\n"
                    f"Our team has been notified. You can track this ticket on your dashboard. Status: **{ticket_result}**"
                )

                return
            else:
                pass

        # ---------------------------------------------------------
        # 2. HANDLE SERVER MESSAGES (The "Detection" Step)
        # ---------------------------------------------------------
        # Only process messages in Guilds (Servers)
        if not message.guild:
            return

        # ---------------------------------------------------------
        # 3. PLAN TIER ENFORCEMENT
        # ---------------------------------------------------------
        is_active, sub_msg = check_guild_subscription(message.guild.id)
        if not is_active:
            # Only notify once per bot session per guild to avoid spam
            if message.guild.id not in self.notified_guilds:
                await message.channel.send(f"⚠️ **Subscription Required**: {sub_msg}")
                self.notified_guilds.add(message.guild.id)
            return

        # Log every message (Only for subscribed guilds)
        full_name = message.author.display_name
        avatar_url = str(message.author.display_avatar.url)
        insert_message(message.author.id, message.channel.id, message.content, message.author.name, full_name, avatar_url)

        # Urgency Check 
        if len(message.content) > 10: 
            result = analyze_urgency(message.content)
            # Result format: "Score|Reason"
            try:
                score_str, reason = result.split("|", 1)
                score = int(score_str)

                if score >= 7:
                    # START ACTIVE TRACKING
                    self.active_reports[message.author.id] = {
                        "content": message.content,
                        "score": score,
                        "channel_id": message.channel.id
                    }

                    # A. NOTIFY ADMINS (Private)
                    admin_channel = discord.utils.get(message.guild.channels, name=".dev")
                    if not admin_channel:
                         admin_channel = discord.utils.get(message.guild.channels, name="dev")
                    
                    if not admin_channel:
                         try:
                             overwrites = {
                                 message.guild.default_role: discord.PermissionOverwrite(read_messages=False),
                                 message.guild.me: discord.PermissionOverwrite(read_messages=True)
                             }
                             admin_channel = await message.guild.create_text_channel('dev', overwrites=overwrites)
                         except:
                             print("Could not create dev channel.")

                    if admin_channel:
                        await admin_channel.send(
                            f"🚨 **Urgency Alert (Level {score}/10)**\n"
                            f"**User:** {message.author.mention}\n"
                            f"**Reason:** {reason}\n"
                            f"**Content:** {message.content}"
                        )

                    # B. FOLLOW-UP WITH USER (Direct Message - Dynamic)
                    follow_up = generate_followup_questions(message.content)
                    
                    try:
                        await message.author.send(follow_up)
                        await message.add_reaction("📩")
                        await message.reply("Hey! I've sent you a DM to get a few more details so we can help you faster.")
                    except discord.Forbidden:
                        # Fallback if DMs are closed
                        await message.reply("I tried to DM you follow-up questions but your DMs are closed. Please check your settings!")
                        # Clean up active report since we can't DM them
                        if message.author.id in self.active_reports:
                            del self.active_reports[message.author.id]

            except ValueError:
                pass

async def setup(bot):
    await bot.add_cog(Urgency(bot))
