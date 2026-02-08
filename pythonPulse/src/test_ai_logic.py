import sys
import os

# Add parent directory to path to import services
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

from services.ai_service import generate_suggestions_from_logs, process_company_info
import json

def test_suggestions_logic():
    print("Testing Suggestions Logic...")
    mock_logs = """
    Alice: I really wish we had a dark mode.
    Bob: Yeah, the white background is too bright.
    Charlie: We need a way to export tickets to CSV.
    Alice: Can we add a search bar to the dashboard?
    """
    
    suggestions = generate_suggestions_from_logs(mock_logs)
    print(f"Generated Suggestions: {json.dumps(suggestions, indent=2)}")
    
    assert isinstance(suggestions, list)
    assert len(suggestions) > 0
    print("✅ Suggestions Test Passed!")

def test_company_info_logic():
    print("\nTesting Company Info Processing...")
    mock_info = """
    ProjectPulse is a project management tool. Our mission is to simplify teamwork.
    Our motto is 'Pulse of Productivity'. 
    We offer a 14-day refund policy.
    Support is available 24/7 via Discord.
    """
    
    qa_pairs = process_company_info(mock_info)
    print(f"Generated QA Pairs: {json.dumps(qa_pairs, indent=2)}")
    
    assert isinstance(qa_pairs, list)
    assert len(qa_pairs) > 0
    print("✅ Company Info Test Passed!")

if __name__ == "__main__":
    try:
        test_suggestions_logic()
        test_company_info_logic()
    except Exception as e:
        print(f"❌ Test Failed: {e}")
