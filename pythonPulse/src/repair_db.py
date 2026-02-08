from services.supabase_client import supabase

def repair_team_linkage():
    print("🚀 Starting Database Repair: Linking Teams to Discord Guilds...")
    
    # 1. Fetch all profiles that have a discord_guild_id
    profiles_res = supabase.table("profiles").select("id, discord_guild_id").not_.is_("discord_guild_id", "null").execute()
    profiles = profiles_res.data or []
    
    if not profiles:
        print("ℹ️ No profiles found with linked Discord guilds. Nothing to repair.")
        return

    print(f"🔍 Found {len(profiles)} linked profiles. Checking for matching teams...")
    
    linked_count = 0
    for profile in profiles:
        user_id = profile["id"]
        guild_id = profile["discord_guild_id"]
        
        # 2. Update teams owned by this user that don't have the guild_id set
        res = supabase.table("teams")\
            .update({"discord_guild_id": guild_id})\
            .eq("owner_id", user_id)\
            .is_("discord_guild_id", "null")\
            .execute()
            
        if res.data:
            print(f"✅ Linked {len(res.data)} team(s) to Guild {guild_id} for user {user_id}")
            linked_count += len(res.data)
            
    print(f"✨ Repair complete. {linked_count} teams were linked to their Discord guilds.")

if __name__ == "__main__":
    repair_team_linkage()
