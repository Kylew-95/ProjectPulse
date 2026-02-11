import discord
from discord.ext import commands
from services.supabase_client import supabase
import os

class Membership(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_member_join(self, member):
        """
        Triggered when a user joins the Discord server.
        Checks if they have a pending invitation in the DB and assigns roles.
        """
        print(f"Member joined: {member.name} (ID: {member.id}) in {member.guild.name}")
        
        try:
            # 1. Check if this discord user has an invitation or profile
            # We look for a profile or team_member entry matching this discord_id
            res = supabase.table("team_members") \
                .select("role, team_id, teams(discord_guild_id)") \
                .eq("discord_id", str(member.id)) \
                .eq("status", "inactive") \
                .execute()

            if res.data:
                for invite in res.data:
                    role_name = invite.get("role")
                    team_id = invite.get("team_id")
                    
                    print(f"Found pending invite for {member.name}: Role={role_name}")
                    
                    # 2. Map Team Role to Discord Role
                    # Hierarchical Mapping:
                    # 'Team Lead' -> 'Moderator' or 'Manager'
                    # 'Developer' -> 'Developer' or 'Member'
                    
                    discord_role_name = "Member"
                    if role_name == "Team Lead":
                        discord_role_name = "Moderator"
                    elif role_name == "Developer":
                        discord_role_name = "Developer"
                        
                    # 3. Assign Role in Discord
                    guild_role = discord.utils.get(member.guild.roles, name=discord_role_name)
                    if not guild_role:
                        # Best effort: create it if it doesn't exist (if bot has permission)
                        try:
                            guild_role = await member.guild.create_role(name=discord_role_name, reason="Auto-created by Pulse Bot for invitations")
                        except Exception as e:
                            print(f"Could not create role {discord_role_name}: {e}")

                    if guild_role:
                        try:
                            await member.add_roles(guild_role)
                            print(f"Assigned role {discord_role_name} to {member.name}")
                        except Exception as e:
                            print(f"Failed to assign role to {member.name}: {e}")

                    # 4. Activate the member in Supabase
                    supabase.table("team_members").update({
                        "status": "active",
                        "user_id": None # This will be linked when they sign into the web portal
                    }).eq("discord_id", str(member.id)).eq("team_id", team_id).execute()
                    
                    # Also try to update profile if it exists
                    supabase.table("profiles").update({
                        "discord_user_id": str(member.id)
                    }).eq("discord_id", str(member.id)).execute()

        except Exception as e:
            print(f"Error handling on_member_join: {e}")

async def setup(bot):
    await bot.add_cog(Membership(bot))
