import cohere
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
