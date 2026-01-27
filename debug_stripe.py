import stripe
import os
from dotenv import load_dotenv
import sys

# Load env from src/.env or .env
load_dotenv(r'e:\2nd drive files\School of code\SOC lessons\playground Apps\ProjectPulse\pythonPulse\.env')
# load_dotenv('pythonPulse/src/.env')

stripe.api_key = os.getenv("STRIPE_KEY")

if stripe.api_key:
    print(f"[INFO] Loaded Stripe Key: {stripe.api_key[:8]}...")
else:
    print("[ERROR] STRIPE_KEY is None")

if not stripe.api_key:
    print("Error: STRIPE_KEY not found in environment.")
    sys.exit(1)

def inspect_recent_customers():
    print(f"\n[INFO] Inspecting 10 most recent Stripe customers...")
    print("-" * 50)
    
    customers = stripe.Customer.list(limit=10)
    
    for idx, cust in enumerate(customers.data):
        print(f"\n[Customer {idx+1}] Email: {cust.email} | ID: {cust.id}")
        subscriptions = stripe.Subscription.list(customer=cust.id, status='all', limit=5)
        
        if not subscriptions.data:
            print("  No subscriptions found.")
        else:
            for sub in subscriptions.data:
                print(f"  SUBSCRIPTION: {sub.id}")
                print(f"    Status: {sub.status}")
                print(f"    Metadata: {sub.metadata}")
                
                if hasattr(sub, 'plan') and sub.plan:
                     prod_id = sub.plan.product
                     print(f"    Product ID: {prod_id}")
                     try:
                         prod = stripe.Product.retrieve(prod_id)
                         print(f"    Product Name: {prod.name}")
                         print(f"    Product Metadata: {prod.metadata}")
                     except Exception as e:
                         print(f"    [WARN] Could not fetch product: {e}")

if __name__ == "__main__":
    # Hardcoded email from the logs for convenience
    target_email = "yeait" # I need the email from the logs? 
    # The logs showed UserID 974f8017... but not the email explicitly in the snippet I saw.
    # Ah, the user's profile fetch log usually has it or I can guess?
    # Actually, I'll ask for input or search logs.
    # Wait, the logs showed "syncSubscription" calls using email.
    # I don't have the email in the logs visible right now (it was JSON.stringify({email})).
    # I'll default to searching for the email associated with the user ID in supabase?
    # No, I can't access Supabase easily without setup.
    # I will just list ALL customers for now or ask the user to provide it?
    # Actually, I'll search for 'yeaitsme' or similar if I saw it? No.
    # I'll just list the logic to TAKE AN ARGUMENT.
    
    inspect_recent_customers()
