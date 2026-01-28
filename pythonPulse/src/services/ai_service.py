import cohere
import json
from config import COHERE_API_KEY

co = cohere.Client(COHERE_API_KEY)

def analyze_urgency(message_content: str):
    """
    Returns a score 0-10 and a reason if urgent.
    """
    prompt = f"""
    Analyze the following Discord message for urgency and sentiment.
    Message: "{message_content}"
    
    If it is a bug report, system outage, or very frustrated customer, rate urgency 7-10.
    If it is a general question, rate 0-3.
    
    Return strict format: Score|Reason
    Example: 8|Critical bug report affecting payment
    """
    try:
        response = co.chat(
            message=prompt,
            model="command-a-03-2025"
        )
        return response.text.strip()
    except Exception as e:
        print(f"Cohere Error: {e}")
        return "0|Error"

def generate_followup_questions(message_content: str):
    """
    Generates 2-3 dynamic follow-up questions based on the user's report.
    """
    prompt = f"""
    A user just reported this issue in a tech support Discord: "{message_content}"
    
    Generate a helpful Direct Message asking between 1 to 3 specific follow-up questions to help debug this specific issue (ask only what is necessary).
    
    Structure it EXACTLY like this:
    "Hey there! I noticed your report about [mention the specific topic]. To help investigate further, could you share:
    1. [Question 1]?
    (Add more numbered questions only if needed)
    
    Thanks so much for the details—it’ll help us get this sorted out faster!"
    
    IMPORTANT: Do NOT use words like "critical", "urgent", "severe", or "emergency". Keep it friendly.
    """
    try:
        response = co.chat(
            message=prompt,
            model="command-a-03-2025"
        )
        return response.text.strip()
    except Exception as e:
        print(f"Cohere Follow-up Error: {e}")
        return "Hey there! Could you please provide more details or a screenshot of the issue?"

def generate_issue_summary(original_issue: str, follow_up_response: str):
    """
    Summarizes the original issue + user's follow-up into a final ticket summary.
    """
    prompt = f"""
    Create a concise, technical summary of this incident report.
    
    Original Report: "{original_issue}"
    User's Follow-up Details: "{follow_up_response}"
    
    Format the output as a single paragraph describing the problem and any provided technical details (error codes, steps).
    """
    try:
        response = co.chat(
            message=prompt,
            model="command-a-03-2025"
        )
        return response.text.strip()
    except Exception as e:
        print(f"Cohere Summary Error: {e}")
        return "Could not generate summary."

def generate_detailed_ticket(original_issue: str, follow_up_response: str):
    """
    Creates a structured JSON report of the incident.
    """
    prompt = f"""
    Analyze this incident report and user follow-up to create a structured ticket.
    
    Original Report: "{original_issue}"
    User's Follow-up Details: "{follow_up_response}"
    
    Return ONLY a JSON object with these keys:
    - type: (one of: "Bug", "Feature Request", "UI/UX", "Support")
    - priority: (one of: "Low", "Medium", "High", "Critical")
    - summary: (concise technical summary)
    - location: (where the issue is happening, e.g. "Landing Page", "Checkout", "Database", "Unknown")
    - solution: (suggested steps to resolve or investigate)
    
    Example:
    {{
      "type": "Bug",
      "priority": "High",
      "summary": "Payment processing failing for Stripe users in UK",
      "location": "Checkout API",
      "solution": "Check stripe webhook logs for 403 errors and verify API keys."
    }}
    """
    try:
        response = co.chat(
            message=prompt,
            model="command-a-03-2025"
        )
        # Handle potential markdown in response
        json_str = response.text.strip()
        if json_str.startswith("```json"):
            json_str = json_str[7:-3].strip()
        elif json_str.startswith("```"):
            json_str = json_str[3:-3].strip()
        
        return json.loads(json_str)
    except Exception as e:
        print(f"Cohere Detailed Ticket Error: {e}")
        return {
            "type": "Support",
            "priority": "Medium",
            "summary": "Report from Discord",
            "location": "Unknown",
            "solution": "Investigate conversation logs."
        }

def generate_summary(messages_text: str):
    """
    Generates a daily summary.
    """
    if not messages_text:
        return "No messages to summarize today."
        
    prompt = f"""
    Summarize the following Discord chat logs into a "Daily Pulse" Executive Summary.
    Highlight top 3 topics, general mood, and any resolved issues.
    
    Logs:
    {messages_text}
    """
    try:
        response = co.chat(
            message=prompt,
            model="command-a-03-2025"
        )
        return response.text.strip()
    except Exception as e:
        print(f"Cohere Error: {e}")
        return "Could not generate summary."
