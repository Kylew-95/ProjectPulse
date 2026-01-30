import stripe
import os
from dotenv import load_dotenv

load_dotenv()

stripe.api_key = os.getenv("STRIPE_KEY")

# Define your plan tiers here in code. 
# This is the "Source of Truth".
PLAN_TIERS = [
    {
        "id": "starter",
        "name": "Starter",
        "description": "For solopreneurs and early-stage projects.",
        "amount": 1800, # In pence (18.00)
        "currency": "gbp",
        "interval": "month",
        "features": "5 projects, Standard AI Analysis, Email support", 
        "tickets": "2,000 tickets/mo",
        "cta": "Get Started",
        "featured": "false"
    },
    {
        "id": "pro",
        "name": "Pro",
        "description": "Perfect for growing teams and active projects.",
        "amount": 2400, # In pence (24.00)
        "currency": "gbp",
        "interval": "month",
        "features": "Unlimited projects, Advanced AI Analytics, Priority support, Web Dashboard Access", 
        "tickets": "10,000 tickets/mo",
        "cta": "Get Started",
        "featured": "true",
        "trial_days": "7"
    },
    {
        "id": "enterprise",
        "name": "Enterprise",
        "description": "For large organizations requiring maximum throughput.",
        "amount": 12000, # In pence (120.00)
        "currency": "gbp",
        "interval": "month",
        "features": "Unlimited everything, Direct Ticketing Integration, Dedicated account manager",
        "tickets": "Unlimited tickets",
        "cta": "Contact Sales",
        "featured": "false"
    }
]

def sync_plan_tiers():
    print("Starting Plan Tiers Sync...")
    
    for plan_tier in PLAN_TIERS:
        # 1. Search for existing product by metadata ID
        existing_products = stripe.Product.search(query=f"metadata['plan_tier_id']:'{plan_tier['id']}'")
        
        if existing_products.data:
            product = existing_products.data[0]
            print(f"Product '{plan_tier['name']}' already exists. Updating...")
            stripe.Product.modify(
                product.id,
                name=plan_tier['name'],
                description=plan_tier['description'],
                metadata={
                    "plan_tier_id": plan_tier['id'],
                    "features": plan_tier['features'],
                    "cta": plan_tier['cta'],
                    "tickets": plan_tier['tickets'],
                    "featured": plan_tier['featured'],
                    "trial_days": plan_tier.get('trial_days')
                }
            )
        else:
            print(f"Creating new Product: '{plan_tier['name']}'")
            product = stripe.Product.create(
                name=plan_tier['name'],
                description=plan_tier['description'],
                metadata={
                    "plan_tier_id": plan_tier['id'],
                    "features": plan_tier['features'],
                    "cta": plan_tier['cta'],
                    "tickets": plan_tier['tickets'],
                    "featured": plan_tier['featured'],
                    "trial_days": plan_tier.get('trial_days')
                }
            )

        # 2. Check for matching Price
        prices = stripe.Price.list(product=product.id, active=True)
        matching_price = None
        for p in prices.data:
            if p.unit_amount == plan_tier['amount'] and p.currency == plan_tier['currency']:
                matching_price = p
                break
        
        if matching_price:
            print(f"  Price found for {plan_tier['name']}: {plan_tier['amount']/100} {plan_tier['currency'].upper()}")
        else:
            print(f"  Creating new Price for {plan_tier['name']}: {plan_tier['amount']/100} {plan_tier['currency'].upper()}")
            stripe.Price.create(
                unit_amount=plan_tier['amount'],
                currency=plan_tier['currency'],
                recurring={"interval": plan_tier['interval']},
                product=product.id,
            )

    print("Sync Complete!")

if __name__ == "__main__":
    if not os.getenv("STRIPE_KEY"):
        print("Error: STRIPE_KEY not found in .env")
    else:
        sync_plan_tiers()
