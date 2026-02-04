import os
import sys
from dotenv import load_dotenv

# Add src to path
sys.path.append(os.path.join(os.getcwd(), 'src'))

from services.ai_service import analyze_urgency

def test_math_urgency():
    load_dotenv()
    
    test_prompts = [
        "OUR ENTIRE SUBSCRIPTION SYSTEM IS DOWN! NO ONE CAN LOG IN!",
        "Quick question: How do I change my profile picture?",
        "I think I found a small typo in the documentation on the team page.",
        "The dashboard is very slow today, it takes 10 seconds to load just for me.",
        "URGENT: Payments are doubling for some of our users randomly!",
    ]

    print("--- TESTING ANALYTICAL URGENCY SCORING ---\n", flush=True)
    
    for prompt in test_prompts:
        print(f"PROMPT: {prompt}", flush=True)
        result = analyze_urgency(prompt)
        print(f"RESULT: {result}", flush=True)
        print("-" * 40, flush=True)

if __name__ == "__main__":
    test_math_urgency()
