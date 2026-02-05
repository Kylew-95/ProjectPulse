import config
import json

try:
    COHERE_API_KEY = getattr(config, "COHERE_API_KEY", None)
    import cohere
    if COHERE_API_KEY:
        co = cohere.Client(COHERE_API_KEY)
    else:
        co = None
        print("COHERE_API_KEY not found in config. AI features will be disabled.")
except ImportError:
    co = None
    print("'cohere' library not found. AI features will be disabled.")
except Exception as e:
    co = None
    error_msg = str(e)
    if "<html" in error_msg.lower():
        print("Failed to initialize Cohere: Received HTML/Cloudflare response.")
    else:
        print(f"Failed to initialize Cohere client: {error_msg}")

def analyze_urgency(message_content: str):
    """
    Returns a score 0-10 and a reason if urgent.
    Uses a mathematical rubric for objectivity.
    """
    prompt = f"""
    Analyze the following Discord message for urgency using this MATHEMATICAL RUBRIC (Total 0-10):

    1. IMPACT (0-3 points): 
       - 3: System-wide (all users/all servers affected)
       - 2: Segmented (specific group or multiple users affected)
       - 1: Individual (only the reporter affected)
       - 0: None/Informational

    2. CRITICALITY (0-3 points):
       - 3: Mission Critical (Payments failing, Login broken, Security breach)
       - 2: Business Core (Primary dashboard broken, data not syncing)
       - 1: Minor (UI glitch, slow performance, non-blocking bug)
       - 0: Cosmetic (Typos, wrong colors, suggestion)

    3. SENTIMENT/FRUSTRATION (0-2 points):
       - 2: High Frustration (Irate, using caps, "Emergency", "Angry")
       - 1: Concerned (Standard bug report, polite but needs fix)
       - 0: Neutral/Positive (Question, "Thanks", "Feature idea")

    4. PERSISTENCE (0-2 points):
       - 2: Permanent (Consistent failure, "Always", "Every time")
       - 1: Intermittent (Happens sometimes, "Randomly")
       - 0: New/Unknown (First time seeing it, "Just happened once")

    Message: "{message_content}"

    Return ONLY a single line in this EXACT pipe-separated format (NO MARKDOWN, NO OTHER TEXT):
    Score|Factor Breakdown|Reason
    
    - Score: Sum of the 4 points (0-10)
    - Factor Breakdown: I:n, C:n, S:n, P:n
    - Reason: One sentence justification
    
    Example: 8|I:3, C:3, S:1, P:1|System-wide login failure affecting all users.
    """

    if not co:
        return "0|Breakdown: N/A|AI Unavailable"
    try:
        response = co.chat(
            message=prompt,
            model="command-a-03-2025"
        )
        return response.text.strip()
    except Exception as e:
        print(f"Cohere Urgency Error: {e}")
        return "0|Breakdown: Error|Service Error"

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

    if not co:
        return "Hey there! Could you please provide more details?"
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

    if not co:
        return "Summary unavailable (AI Validation pending)."
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
    
    SYSTEM CONTEXT:
    - Application Name: Project Pulse
    - Purpose: SaaS Dashboard for Project Management & Ticketing (similar to Jira/Trello).
    - Critical Flows: Login, Payment/Subscription (Stripe), Ticket Creation, Data Sync.
    
    Original Report: "{original_issue}"
    User's Follow-up Details: "{follow_up_response}"
    
    PRIORITY DETERMINATION LOGIC (Context Matters!):
    1. CONTEXTUAL CRITICALITY: If a feature is core to the app's purpose, it is High/Critical.
       - Example: "Add Item button broken" on a Food Delivery App -> CRITICAL (Can't order).
       - Example: "Add Item button broken" on a Profile Settings page -> MEDIUM.
       - Example: "Login failed" -> CRITICAL (Blocker).
       
    2. SCOPE:
       - "Localhost" / "My Machine" -> LOW (User environment issue).
       - "Production" / "Everyone" -> HIGH/CRITICAL.
       
    3. SEVERITY:
       - "Cosmetic / Typo" -> LOW.
       - "Crash / 404 / 500 Error" -> HIGH.

    Return ONLY a JSON object with these keys:
    - type: (one of: "Bug", "Feature Request", "UI/UX", "Support")
    - priority: (one of: "Low", "Medium", "Critical")
    - summary: (concise technical summary)
    - location: (where the issue is happening, e.g. "Landing Page", "Checkout", "Database", "Unknown")
    - solution: (suggested steps to resolve or investigate)
    
    Example Output:
    {{
      "type": "Bug",
      "priority": "Critical",
      "summary": "Payment processing failing for Stripe users in UK",
      "location": "Checkout API",
      "solution": "Check stripe webhook logs for 403 errors and verify API keys."
    }}
    """

    if not co:
        return {
            "type": "Support", 
            "priority": "Medium", 
            "summary": original_issue, 
            "location": "Unknown", 
            "solution": "AI analysis disabled."
        }
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

    if not co:
        return "AI Summary unavailable."
    try:
        response = co.chat(
            message=prompt,
            model="command-a-03-2025"
        )
        return response.text.strip()
    except Exception as e:
        print(f"Cohere Error: {e}")
        return "Could not generate summary."

def generate_suggested_reply(ticket_content: str, kb_context: str):
    """
    Generates a suggested reply based on ticket content and knowledge base context.
    """
    prompt = f"""
    You are a support agent for Project Pulse. 
    A user has reported the following issue: "{ticket_content}"
    
    Use the following Knowledge Base entries for context:
    {kb_context}
    
    Draft a CONCISE, friendly, and helpful reply for DISCORD.
    
    RULES:
    1. Keep it under 150 words.
    2. Use Discord markdown (e.g., **bold** for emphasis).
    3. DO NOT use email-style formalisms (no "Dear...", no "Warm regards...", no "Subject:").
    4. Start directly with the answer or a friendly greeting like "Hey there!".
    5. If the answer is in the context, provide it clearly. 
    6. If not, ask one specific follow-up question or provide a single troubleshooting step.
    
    The response will be sent directly to the user who reported the issue.
    """

    if not co:
        return "I'm sorry, I couldn't generate a suggestion right now. Please check our documentation."
    try:
        if not co:
            return "AI service is currently unavailable."
        response = co.chat(
            message=prompt,
            model="command-a-03-2025"
        )
        return response.text.strip()
    except Exception as e:
        print(f"Cohere Suggestion Error: {e}")
        return "Could not generate suggested reply."

def generate_kb_answer(user_query: str, kb_context: str):
    """
    Generates a direct answer to a user's question based on KB context.
    """
    prompt = f"""
    You are the Project Pulse AI Support Assistant.
    A user asked: "{user_query}"
    
    Here is the relevant information from our Knowledge Base:
    {kb_context}
    
    INSTRUCTIONS:
    1. Answer the user's question clearly and concisely using ONLY the provided context.
    2. If the context contains the answer, rewrite it in a friendly, helpful tone.
    3. If the context does NOT contain the answer, politely say: "I couldn't find the exact answer in my database. valid commands are !ticket create <title> | <description> to open a support ticket."
    4. Do not make up information not in the context.
    
    Keep the response under 200 words.
    """

    if not co:
        return "I'm sorry, my AI brain is currently offline. Please check the manual or open a ticket."
    try:
        response = co.chat(
            message=prompt,
            model="command-a-03-2025"
        )
        return response.text.strip()
    except Exception as e:
        print(f"Cohere KB Answer Error: {e}")
        return "I encountered an error trying to process your question. Please try again later."
