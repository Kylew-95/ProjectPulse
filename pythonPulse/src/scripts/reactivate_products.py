import os
import stripe
from dotenv import load_dotenv

# Load env from parent directory (since script is in src/scripts) or current
load_dotenv() 

stripe.api_key = os.getenv("STRIPE_KEY")

def reactivate_products():
    print("Checking for inactive products...")
    # List inactive products
    try:
        inactive = stripe.Product.list(active=False, limit=100)
        print(f"Found {len(inactive.data)} inactive products.")
        
        for p in inactive.data:
            print(f"Reactivating: {p.name} ({p.id})")
            stripe.Product.modify(p.id, active=True)
            
        print("✅ Reactivation complete.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    reactivate_products()
