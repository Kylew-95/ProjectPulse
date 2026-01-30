import discord
from discord.ext import commands
from services.ai_service import analyze_urgency, generate_followup_questions, generate_detailed_ticket
from services.supabase_client import insert_message, check_guild_subscription, supabase
from services.ticket_service import get_ticket_service
import json

class Urgency(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.active_reports = {}
        self.ticket_service = get_ticket_service()
        self.notified_guilds = set() # Simple anti-spam for no-tier message
        self.notified_sessions = set() # Anti-spam for "I sent you a DM"

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
            # Log the user's DM response
            insert_message(
                message.author.id, 
                message.channel.id, 
                message.content, 
                message.author.name, 
                message.author.display_name, 
                str(message.author.display_avatar.url)
            )

            # Acknowledgment (Make it feel responsive)
            async with message.channel.typing():
                ack_msg = await message.channel.send("Got it! I'm analyzing your additional details now...")

            # Look for active session in memory
            ticket_id = None
            original_issue = None
            guild_id = None

            if message.author.id in self.active_reports:
                session = self.active_reports.pop(message.author.id)
                ticket_id = session.get("ticket_id")
                original_issue = session.get("content")
                guild_id = session.get("guild_id")
            else:
                # RECOVERY LOGIC: Look for a "Pending..." ticket in the DB for this user
                try:
                    print(f"DEBUG: Session lost for {message.author.name}, attempting recovery from DB...")
                    res = supabase.table("tickets")\
                        .select("*")\
                        .eq("discord_id", str(message.author.id))\
                        .eq("status", "open")\
                        .order("created_at", desc=True)\
                        .limit(1)\
                        .execute()
                    
                    if res.data:
                        ticket = res.data[0]
                        ticket_id = ticket.get("id")
                        original_issue = ticket.get("description")
                        guild_id = ticket.get("discord_guild_id")
                        print(f"DEBUG: Recovered ticket {ticket_id} for {message.author.name}")
                    else:
                        print(f"DEBUG: No pending ticket found for {message.author.name} in DB.")
                except Exception as e:
                    print(f"Recovery Error: {e}")

            if ticket_id:
                # Generate Structured AI Report (now with follow-up)
                ai_report = generate_detailed_ticket(original_issue, message.content)
                
                # Construct the update report
                report = {
                    "user": message.author.name,
                    "original_issue": original_issue,
                    "follow_up_details": message.content,
                    "summary": ai_report.get("summary", "New report from Discord"),
                    "type": ai_report.get("type", "Support"),
                    "priority": ai_report.get("priority", "Medium"),
                    "location": ai_report.get("location", "Unknown"),
                    "solution": ai_report.get("solution", "Investigate conversation logs."),
                    "status": "OPEN"
                }

                # UPDATE TICKET
                success = self.ticket_service.update_ticket(ticket_id, report)
                ticket_result = "Updated in Database" if success else "Update Failed"

                # Thank the user
                await message.channel.send(
                    f"**Report Updated!**\n\n"
                    f"**Summary:** {report['summary']}\n"
                    f"**Priority:** {report['priority']}\n"
                    f"**Type:** {report['type']}\n\n"
                    f"**Suggested Solution:**\n{report['solution']}\n\n"
                    f"Our team has been notified. You can track this ticket on your dashboard. Status: **{ticket_result}**"
                )

                return
            else:
                # If no session and no ticket, it's just a regular DM
                await message.channel.send("Hey! If you have an issue to report, please post it in the server's `#report-issues-with-pulse` channel first.")
                return

        # ---------------------------------------------------------
        # 2. HANDLE SERVER MESSAGES (The "Detection" Step)
        # ---------------------------------------------------------
        # Only process messages in Guilds (Servers)
        if not message.guild:
            return
        
        # Only respond in #report-issues-with-pulse channel
        if message.channel.name.lower() != "report-issues-with-pulse":
            return

        # ---------------------------------------------------------
        # 3. PLAN TIER ENFORCEMENT
        # ---------------------------------------------------------
        is_active, sub_msg = check_guild_subscription(message.guild.id)
        print(f"\nSUBSCRIPTION CHECK for Guild {message.guild.name} (ID: {message.guild.id})")
        print(f"   Active: {is_active}")
        print(f"   Message: {sub_msg}\n")
        
        if not is_active:
            # Only notify once per bot session per guild to avoid spam
            if message.guild.id not in self.notified_guilds:
                await message.channel.send(f"**Subscription Required**: {sub_msg}")
                self.notified_guilds.add(message.guild.id)
            return

        # Log every message (Only for subscribed guilds)
        full_name = message.author.display_name
        avatar_url = str(message.author.display_avatar.url)
        insert_message(message.author.id, message.channel.id, message.content, message.author.name, full_name, avatar_url)

        # Anti-Spam / Concurrent Report Check
        if message.author.id in self.active_reports:
            return

        # Urgency Check 
        result = analyze_urgency(message.content)
        # Result format: "Score|Reason"
        try:
            if "|" in result:
                score_str, reason = result.split("|", 1)
            else:
                score_str = result
                reason = "No reason provided by AI"
            
            score = int(score_str)

            if score >= 5:
                # Create Ticket IMMEDIATELY (Preliminary Report)
                pre_report = generate_detailed_ticket(message.content, "")
                ticket_data = {
                    "user": message.author.name,
                    "full_name": message.author.display_name,
                    "avatar_url": str(message.author.display_avatar.url),
                    "user_id": str(message.author.id),
                    "guild_id": str(message.guild.id),
                    "original_issue": message.content,
                    "follow_up_details": "Pending...",
                    "summary": pre_report.get("summary", "New report from Discord"),
                    "type": pre_report.get("type", "Support"),
                    "priority": pre_report.get("priority", "Medium"),
                    "location": pre_report.get("location", "Unknown"),
                    "solution": pre_report.get("solution", "Analyzing report..."),
                    "urgency_score": score,
                    "origin_channel_id": str(message.channel.id),
                    "status": "OPEN"
                }
                
                # Create ticket and get ID
                ticket_id = self.ticket_service.create_ticket(ticket_data)

                # START ACTIVE TRACKING
                self.active_reports[message.author.id] = {
                    "content": message.content,
                    "score": score,
                    "channel_id": message.channel.id,
                    "guild_id": message.guild.id,
                    "ticket_id": ticket_id
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
                        f"Urgency Alert (Level {score}/10)\n"
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

    @commands.command(name="report")
    async def manual_report(self, ctx, *, issue_content: str = None):
        """Manually trigger the ticketing process."""
        if not issue_content:
            await ctx.send("Please provide the issue description. Usage: `!report <describe your problem>`")
            return

        # Use the same logic as auto-detection but forced
        if ctx.guild:
            # Check tier (reusing existing logic)
            is_active, sub_msg = check_guild_subscription(ctx.guild.id)
            if not is_active:
                await ctx.send(f"**Subscription Required**: {sub_msg}")
                return

        # Create ticket
        pre_report = generate_detailed_ticket(issue_content, "")
        ticket_data = {
            "user": ctx.author.name,
            "full_name": ctx.author.display_name,
            "avatar_url": str(ctx.author.display_avatar.url),
            "user_id": str(ctx.author.id),
            "guild_id": str(ctx.guild.id) if ctx.guild else None,
            "original_issue": issue_content,
            "follow_up_details": "Manual Report - Initial",
            "summary": pre_report.get("summary", "Manual report from Discord"),
            "type": pre_report.get("type", "Support"),
            "priority": pre_report.get("priority", "Medium"),
            "location": pre_report.get("location", "Unknown"),
            "solution": pre_report.get("solution", "Analyzing report..."),
            "urgency_score": 7, # Manual reports get a fixed baseline high score
            "origin_channel_id": str(ctx.channel.id) if ctx.channel else None,
            "status": "OPEN"
        }
        
        ticket_id = self.ticket_service.create_ticket(ticket_data)
        
        self.active_reports[ctx.author.id] = {
            "content": issue_content,
            "score": 7,
            "channel_id": ctx.channel.id,
            "guild_id": ctx.guild.id if ctx.guild else None,
            "ticket_id": ticket_id
        }

        # Follow up
        follow_up = generate_followup_questions(issue_content)
        try:
            await ctx.author.send(follow_up)
            await ctx.message.add_reaction("📩")
            await ctx.reply("I've manually created a ticket for you and sent a DM for more details.")
        except discord.Forbidden:
            await ctx.reply("Ticket created, but I couldn't DM you. Please check your settings!")

async def setup(bot):
    await bot.add_cog(Urgency(bot))
