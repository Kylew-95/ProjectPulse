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

class SupabaseTicketService(TicketService):
    def create_ticket(self, report_data):
        import uuid
        user_id = report_data.get("user_id")
        discord_id = str(user_id) if user_id else None
        supabase_uuid = None
        # Try to find the user's Supabase UUID and Team by their Discord ID
        team_id = None
        if discord_id:
            try:
                # 1. Find profile
                profile_result = supabase.table("profiles").select("id").eq("discord_user_id", discord_id).execute()
                
                if profile_result.data and len(profile_result.data) > 0:
                    supabase_uuid = profile_result.data[0].get("id")
                    print(f"Found Supabase UUID for Discord user {discord_id}: {supabase_uuid}")
                    
                    # 2. Find Team (Lookup memberships)
                    team_res = supabase.table("team_members").select("team_id").eq("user_id", supabase_uuid).limit(1).execute()
                    if team_res.data:
                        team_id = team_res.data[0].get("team_id")
                        print(f"Automatically assigned ticket to team: {team_id}")
                else:
                    print(f"Warning: No Supabase profile found for Discord user ID: {discord_id}")
                    print(f"   User needs to sign up at ProjectPulse with their Discord account!")
            except Exception as e:
                print(f"Error looking up user/team: {e}")

        data = {
            "reporter_id": supabase_uuid,
            "team_id": team_id,
            "discord_id": discord_id,
            "discord_guild_id": report_data.get("guild_id"),
            "user_name": report_data["user"],
            "description": report_data["original_issue"],
            "title": report_data.get("summary") or report_data.get("final_summary"),
            "urgency_score": int(report_data.get("urgency_score", 5)),
            "status": (report_data.get("status") or "open").lower(),
            "type": (report_data.get("type") or "support").lower(),
            "priority": (report_data.get("priority") or "medium").lower(),
            "solution": report_data.get("solution"),
            "location": (report_data.get("location") or "unknown").lower()

        }

        try:
            print(f"DEBUG: Attempting to insert ticket data: {json.dumps(data, indent=2)}")
            response = supabase.table("tickets").insert(data).execute()
            print(f"DEBUG: Supabase Insert Response Data: {response.data}")
            
            ticket_id = response.data[0].get("id") if response.data else None
            print(f"Ticket created successfully with ID: {ticket_id}")
            return ticket_id


        except Exception as e:
            print(f"!!!! Supabase Ticket Insert Error: {e}")
            import traceback
            traceback.print_exc()
            return None

    def update_ticket(self, ticket_id, report_data):
        if not ticket_id:
            print("DEBUG: update_ticket called with no ticket_id")
            return False

        data = {
            "description": f"{report_data['original_issue']}\n\nFOLLOW-UP:\n{report_data['follow_up_details']}",
            "title": report_data.get("summary") or report_data.get("final_summary"),
            "type": (report_data.get("type") or "support").lower(),
            "priority": (report_data.get("priority") or "medium").lower(),
            "solution": report_data.get("solution"),
            "location": (report_data.get("location") or "unknown").lower(),
            # Removed updated_at: now() as it can cause type errors if sent as a raw string across the API
        }

        try:
            print(f"DEBUG: Attempting to update ticket {ticket_id} with data: {json.dumps(data, indent=2)}")
            response = supabase.table("tickets").update(data).eq("id", ticket_id).execute()
            print(f"DEBUG: Supabase Update Response Data: {response.data}")
            return True
        except Exception as e:
            print(f"!!!! Supabase Ticket Update Error: {e}")
            import traceback
            traceback.print_exc()
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
