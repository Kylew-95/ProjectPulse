import os
import sys
from dotenv import load_dotenv

# Add src to path
sys.path.append(os.path.join(os.getcwd(), 'src'))

from services.ai_service import analyze_urgency

def test_math_urgency():
    load_dotenv()
    
    prompt = "OUR ENTIRE SUBSCRIPTION SYSTEM IS DOWN! NO ONE CAN LOG IN!"
    print(f"PROMPT: {prompt}")
    result = analyze_urgency(prompt)
    print(f"RESULT: {result}")

if __name__ == "__main__":
    test_math_urgency()
