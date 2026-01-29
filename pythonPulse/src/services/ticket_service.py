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

class LogTicketService(TicketService):
    def create_ticket(self, report_data):
        print("\n[TICKET SYSTEM LOG] Ticket created internally.")
        print(json.dumps(report_data, indent=2))
        return "Logged to Console"

class SupabaseTicketService(TicketService):
    def create_ticket(self, report_data):
        import uuid
        user_id = report_data.get("user_id")
        discord_id = None
        supabase_uuid = None

        # Check if user_id is a valid UUID (Supabase) or just a Discord ID (string/int)
        try:
            if user_id:
                uuid.UUID(str(user_id))
                supabase_uuid = user_id
        except ValueError:
            # Not a UUID, treated as Discord ID
            discord_id = str(user_id)

        data = {
            "reporter_id": supabase_uuid,
            "discord_id": discord_id,
            "user_name": report_data["user"],
            "description": report_data["original_issue"],
            "title": report_data.get("summary") or report_data.get("final_summary"),
            "urgency_score": report_data.get("urgency_score", 5),
            "status": "open",
            "type": (report_data.get("type") or "support").lower(),
            "priority": (report_data.get("priority") or "medium").lower(),
            "solution": report_data.get("solution"),
            "location": (report_data.get("location") or "unknown").lower()

        }

        try:
            supabase.table("tickets").insert(data).execute()
            return "Saved to Supabase Database"


        except Exception as e:
            print(f"Supabase Ticket Error: {e}")
            return "Failed to save to DB"

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
            return "Created Trello Card"
        except Exception as e:
            print(f"Trello Error: {e}")
            return "Failed to create Trello Card"

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
### 🚨 Urgency Level: {report_data['urgency_score']}/10
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
            return "Created GitHub Issue"
        except Exception as e:
            print(f"GitHub Error: {e}")
            return "Failed to create GitHub Issue"

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
            return "Created Jira Ticket"
        except Exception as e:
            print(f"Jira Error: {e}")
            return "Failed to create Jira Ticket"

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
