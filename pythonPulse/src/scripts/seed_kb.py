
import sys
import os

# Add parent directory to path to import services
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Mock database imports to prevent key errors if main app isn't running
# In reality, this script needs the env vars loaded. 
# services.supabase_client handles dotenv loading via config.py import.

try:
    from services.supabase_client import add_knowledge_base_item
except Exception as e:
    print(f"Error importing dependencies: {e}")
    print("Ensure you are running this from the project root or src directory.")
    sys.exit(1)

common_entries = [
    {
        "question": "How do I reset my password?",
        "answer": "Go to the Settings page, click 'Security', and select 'Reset Password'. You will receive an email with a reset link."
    },
    {
        "question": "How do I upgrade my subscription?",
        "answer": "Navigate to the Billing tab in your dashboard. Select the plan you want (Pro or Enterprise) and verify your payment details."
    },
    {
        "question": "The bot is not responding in Discord, what do I do?",
        "answer": "Check if the bot has the correct permissions (Send Messages, Read History). If the issue persists, ensure your server is linked to an active subscription."
    },
    {
        "question": "What is the Project Pulse refund policy?",
        "answer": "We offer a 14-day money-back guarantee for new subscriptions. Contact support via ticket to initiate a refund."
    },
    {
        "question": "How do I invite team members?",
        "answer": "On the Team page, click 'Invite Member', enter their email address, and select their role/permissions."
    },
    {
        "question": "Where can I find my API keys?",
        "answer": "API keys are located in Settings > Developer. Keep these keys secret and do not share them publicly."
    },
    {
        "question": "Can I integrate with Jira?",
        "answer": "Yes, Jira integration is available on Pro and Enterprise plans. Setup the connection in Settings > Integrations."
    },
    {
        "question": "My analytics are not loading",
        "answer": "This can happen if data is still syncing. Wait 5-10 minutes. If it persists, try clearing your browser cache or check your internet connection."
    },
    {
        "question": "What are the different subscription plans?",
        "answer": "ProjectPulse offers three tiers: Starter ($18/mo for individuals), Pro ($24/mo for growing teams), and Enterprise ($120/mo for large organizations). Each tier offers increasing levels of AI analysis and ticket volume."
    },
    {
        "question": "How do I create a support ticket in Discord?",
        "answer": "You can create a ticket by using the command `!ticket create <title> | <description>`. For example: `!ticket create Login Issue | I cannot access my dashboard.`"
    },
    {
        "question": "Can I use ProjectPulse for free?",
        "answer": "We offer a 7-day free trial on our Pro plan so you can test all features before committing."
    },
    {
        "question": "How do I link my Discord server to ProjectPulse?",
        "answer": "Invite the ProjectPulse bot to your server. Once the bot joins, it will attempt to automatically link the server if you have an active account. You can also manage links in the Dashboard under Settings > Discord."
    }
]

print("Starting KB Seeding...")
count = 0
for entry in common_entries:
    # Check if duplicate exists (simple check not implemented) - just try insert
    print(f"Adding: {entry['question']}")
    success = add_knowledge_base_item(entry['question'], entry['answer'])
    if success:
        count += 1
    else:
        print(f"Failed to add (might be duplicate or error): {entry['question']}")

print(f"✅ Finished! Added {count} entries to the Knowledge Base.")
