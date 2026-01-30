import os
import sys
import time
from dotenv import load_dotenv
from supabase import create_client

# Add src to path to allow imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Import the actual AI logic
from services.ai_service import generate_detailed_ticket

def create_ticket():
    load_dotenv()
    
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        print("Error: Supabase credentials not found.")
        return

    supabase = create_client(url, key)

    test_cases = [
        {
            "priority": "Low",
            "report": "User unable to log in to website, consistently receiving 404 error on localhost using Edge browser",
            "followup": "local host edge on my pc and it happens all the time"
        },
        {
            "priority": "Medium",
            "report": "The 'Add Item' button on the settings profile page isn't clicking.",
            "followup": "It's just the profile picture upload button, everything else works."
        },
        {
            "priority": "Critical",
            "report": "500 Internal Server Error when trying to view the Team Dashboard.",
            "followup": "It's happening for all our admin users since the last deploy."
        },
        {
            "priority": "Critical",
            "report": "Payments are failing! Customers are being charged but subscriptions aren't updating.",
            "followup": "We are losing money and getting angry support tickets right now."
        }
    ]

    print(f"Starting AI Priority Verification (Running {len(test_cases)} scenarios)...\n")
    
    for i, case in enumerate(test_cases, 1):
        print(f"--- TEST CASE {i}: Expecting {case['priority'].upper()} ---")
        print(f"Report: {case['report']}")
        
        try:
            # Simulate AI Analysis
            ai_report = generate_detailed_ticket(case['report'], case['followup'])
            predicted_priority = ai_report.get('priority')
            
            print(f"AI Result: {predicted_priority}")
            
            # Simple Pass/Fail Check (Case insensitive)
            if predicted_priority.lower() == case['priority'].lower():
                print("PASSED")
            else:
                print(f"MISMATCH (Expected {case['priority']}, got {predicted_priority})")
            
            # Insert into DB for record
            ticket_data = {
                "title": f"[TEST {case['priority']}] " + ai_report.get("summary", "No Summary"),
                "description": f"AI Validation Test.\nExpected: {case['priority']}\nActual: {predicted_priority}\n\nScenario: {case['report']}",
                "type": ai_report.get("type", "Bug"),
                "priority": predicted_priority.lower() if predicted_priority else "low", 
                "location": ai_report.get("location", "Unknown"),
                "solution": ai_report.get("solution", "None"),
                "status": "closed", # Auto-close tests
                "urgency_score": 5, 
                "origin_channel_id": "TEST_RUN_ID"
            }
            
            supabase.table("tickets").insert(ticket_data).execute()
            print("Saved to DB.\n")
            
        except Exception as e:
            print(f"Error in Test Case {i}: {e}\n")
        
        time.sleep(1) # Avoid rate limits if any

if __name__ == "__main__":
    create_ticket()
