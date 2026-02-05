import os
import requests
import json
from config import (
    TICKET_PROVIDER, 
    TRELLO_API_KEY, TRELLO_TOKEN, TRELLO_LIST_ID,
    GITHUB_TOKEN, GITHUB_REPO,
    JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY
)
from services.supabase_client import supabase

class TicketService:
    def create_ticket(self, report_data):
        raise NotImplementedError

    def update_ticket(self, ticket_id, report_data):
        raise NotImplementedError

class LogTicketService(TicketService):
    def create_ticket(self, report_data):
        print("\n[TICKET SYSTEM LOG] Ticket created internally.")
        print(json.dumps(report_data, indent=2))
        return "LOGGED-INTERNAL"

    def update_ticket(self, ticket_id, report_data):
        print(f"\n[TICKET SYSTEM LOG] Ticket {ticket_id} updated with follow-up.")
        print(json.dumps(report_data, indent=2))
        return True

class SupabaseTicketService(TicketService):
    def create_ticket(self, report_data):
        # Ensure discord IDs are present
        discord_id = str(report_data.get("discord_id") or report_data.get("user_id") or "")
        guild_id = str(report_data.get("guild_id") or "")
        
        # Resolve reporter_id (supabase uuid)
        supabase_uuid = report_data.get("reporter_id") or report_data.get("supabase_user_id")
        
        if not supabase_uuid and discord_id:
            try:
                # Look up user by discord_user_id (preferred) or discord_id in profiles
                profile_res = supabase.table("profiles").select("id").eq("discord_user_id", discord_id).execute()
                if not profile_res.data:
                    profile_res = supabase.table("profiles").select("id").eq("discord_id", discord_id).execute()
                
                if profile_res.data:
                    supabase_uuid = profile_res.data[0]["id"]
            except Exception as e:
                print(f"DEBUG: Profile lookup failed for Discord user {discord_id}: {e}")
                pass
        
        # Resolve team_id if not provided
        team_id = report_data.get("team_id")
        if not team_id and guild_id:
            try:
                guild_res = supabase.table("teams").select("id").eq("discord_guild_id", guild_id).execute()
                if guild_res.data:
                    team_id = guild_res.data[0]["id"]
            except Exception as e:
                print(f"DEBUG: Team lookup failed for guild {guild_id}: {e}")
                pass

        # Prepare insertion data using actual DB column names
        data = {
            "reporter_id": supabase_uuid,
            "team_id": team_id,
            "discord_id": discord_id,
            "discord_guild_id": guild_id,
            "user_name": report_data.get("user", "Unknown User"),
            "description": report_data.get("original_issue", report_data.get("description", "No description provided")),
            "title": report_data.get("summary") or report_data.get("title") or report_data.get("final_summary") or "New Issue",
            "urgency_score": int(report_data.get("urgency_score", 5)),
            "status": (report_data.get("status") or "open").lower(),
            "type": (report_data.get("type") or "support").lower(),
            "priority": (report_data.get("priority") or "medium").lower(),
            "solution": report_data.get("solution"),
            "location": (report_data.get("location") or "unknown").lower(),
            "discord_channel_id": str(report_data.get("origin_channel_id") or report_data.get("discord_channel_id") or "")
        }

        try:
            print(f"DEBUG: Attempting to insert ticket: {data['title']} for {data['user_name']}")
            # Use .select() to ensure the generated id is returned in response.data
            response = supabase.table("tickets").insert(data).execute()
            
            if response.data:
                ticket_id = response.data[0].get("id")
                print(f"DEBUG: Ticket created successfully. ID: {ticket_id}")
                return ticket_id
            else:
                print("!!!! Supabase insert succeeded but returned no data.")
                return None
        except Exception as e:
            print(f"!!!! Supabase Ticket Insert ERROR: {e}")
            import traceback
            traceback.print_exc()
            return None

    def update_ticket(self, ticket_id, report_data):
        if not ticket_id:
            return False

        data = {
            "description": f"{report_data['original_issue']}\n\nFOLLOW-UP:\n{report_data.get('follow_up_details', '')}",
            "title": report_data.get("summary") or report_data.get("title") or report_data.get("final_summary"),
            "type": (report_data.get("type") or "support").lower(),
            "priority": (report_data.get("priority") or "medium").lower(),
            "status": (report_data.get("status") or "open").lower(),
            "solution": report_data.get("solution"),
            "location": (report_data.get("location") or "unknown").lower()
        }
        
        # Clean None values to avoid overwriting with nulls if update is partial
        data = {k: v for k, v in data.items() if v is not None}

        try:
            supabase.table("tickets").update(data).eq("id", ticket_id).execute()
            return True
        except Exception as e:
            print(f"!!!! Supabase Ticket Update ERROR: {e}")
            return False

class TrelloTicketService(TicketService):
    def create_ticket(self, report_data):
        if not all([TRELLO_API_KEY, TRELLO_TOKEN, TRELLO_LIST_ID]):
            return "Trello Config Missing"

        url = "https://api.trello.com/1/cards"
        name = f"Urgent: {report_data['user']} (Score: {report_data['urgency_score']})"
        desc = f"**Summary**:\n{report_data['final_summary']}\n\n**Full Details**:\n{report_data['follow_up_details']}"
        
        query = {
            'key': TRELLO_API_KEY,
            'token': TRELLO_TOKEN,
            'idList': TRELLO_LIST_ID,
            'name': name,
            'desc': desc
        }
        try:
            requests.post(url, params=query).raise_for_status()
            return "TRELLO-CARD"
        except Exception as e:
            print(f"Trello Error: {e}")
            return None

    def update_ticket(self, ticket_id, report_data):
        # Trello update is complex via simple string IDs, so we just log for now
        print(f"Trello update requested for {ticket_id}")
        return True

class GitHubTicketService(TicketService):
    def create_ticket(self, report_data):
        if not all([GITHUB_TOKEN, GITHUB_REPO]):
            return "GitHub Config Missing"
            
        url = f"https://api.github.com/repos/{GITHUB_REPO}/issues"
        headers = {
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json"
        }
        title = f"Urgency Report: {report_data['user']}"
        body = f"""
### Urgency Level: {report_data['urgency_score']}/10
**User**: {report_data['user']}

### Summary
{report_data['final_summary']}

### Original Issue
{report_data['original_issue']}

### Follow-up Details
{report_data['follow_up_details']}
        """
        data = {"title": title, "body": body, "labels": ["bug", "urgent"]}
        try:
            requests.post(url, json=data, headers=headers).raise_for_status()
            return "GITHUB-ISSUE"
        except Exception as e:
            print(f"GitHub Error: {e}")
            return None

    def update_ticket(self, ticket_id, report_data):
        print(f"GitHub update requested for {ticket_id}")
        return True

class JiraTicketService(TicketService):
    def create_ticket(self, report_data):
        if not all([JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY]):
            return "Jira Config Missing"

        url = f"{JIRA_URL}/rest/api/3/issue"
        auth = (JIRA_EMAIL, JIRA_API_TOKEN)
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        
        # Jira ADF (Atlassian Document Format) is complex, so we use a simple description
        description_text = f"User: {report_data['user']}\nSummary: {report_data['final_summary']}\n\nDetails:\n{report_data['follow_up_details']}"

        data = {
            "fields": {
                "project": {"key": JIRA_PROJECT_KEY},
                "summary": f"Urgent: {report_data['user']} (Score: {report_data['urgency_score']})",
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [{
                        "type": "paragraph", 
                        "content": [{"type": "text", "text": description_text}]
                    }]
                },
                "issuetype": {"name": "Task"}
            }
        }
        try:
            requests.post(url, json=data, headers=headers, auth=auth).raise_for_status()
            return "JIRA-TICKET"
        except Exception as e:
            print(f"Jira Error: {e}")
            return None

    def update_ticket(self, ticket_id, report_data):
        print(f"Jira update requested for {ticket_id}")
        return True

def get_ticket_service():
    if TICKET_PROVIDER == "TRELLO":
        return TrelloTicketService()
    elif TICKET_PROVIDER == "SUPABASE":
        return SupabaseTicketService()
    elif TICKET_PROVIDER == "GITHUB":
        return GitHubTicketService()
    elif TICKET_PROVIDER == "JIRA":
        return JiraTicketService()
    else:
        return LogTicketService()
