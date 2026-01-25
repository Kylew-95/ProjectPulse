import stripe
import os
from dotenv import load_dotenv

load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# Define your plans here in code. 
# This is the "Source of Truth".
PLANS = [
    {
        "id": "free_trial",
        "name": "Free Trial",
        "description": "Test the waters with full access for one month.",
        "amount": 0,
        "currency": "gbp",
        "interval": "month",
        "features": "1 project, Basic AI features, Community support, 500 tickets limit",
        "cta": "Start Free Trial",
        "featured": "false"
    },
    {
        "id": "starter",
        "name": "Starter",
        "description": "For solopreneurs and early-stage projects.",
        "amount": 1800, # In pence (£18.00)
        "currency": "gbp",
        "interval": "month",
        "features": "5 projects, Standard AI Analysis, Email support, 2,000 tickets/mo",
        "cta": "Get Started",
        "featured": "false"
    },
    {
        "id": "pro",
        "name": "Pro",
        "description": "Perfect for growing teams and active projects.",
        "amount": 2400, # In pence (£24.00)
        "currency": "gbp",
        "interval": "month",
        "features": "Unlimited projects, Advanced AI Analytics, Priority support, Web Dashboard Access, 10,000 tickets/mo",
        "cta": "Get Started",
        "featured": "true"
    },
    {
        "id": "enterprise",
        "name": "Enterprise",
        "description": "For large organizations requiring maximum throughput.",
        "amount": 12000, # In pence (£120.00)
        "currency": "gbp",
        "interval": "month",
        "features": "Unlimited everything, Direct Ticketing Integration, Dedicated account manager, Unlimited tickets",
        "cta": "Contact Sales",
        "featured": "false"
    }
]

def sync_plans():
    print("🚀 Starting Stripe Plan Sync...")
    
    for plan in PLANS:
        # 1. Search for existing product by metadata ID
        existing_products = stripe.Product.search(query=f"metadata['plan_id']:'{plan['id']}'")
        
        if existing_products.data:
            product = existing_products.data[0]
            print(f"📦 Product '{plan['name']}' already exists. Updating...")
            stripe.Product.modify(
                product.id,
                name=plan['name'],
                description=plan['description'],
                metadata={
                    "plan_id": plan['id'],
                    "features": plan['features'],
                    "cta": plan['cta'],
                    "featured": plan['featured']
                }
            )
        else:
            print(f"✨ Creating new Product: '{plan['name']}'")
            product = stripe.Product.create(
                name=plan['name'],
                description=plan['description'],
                metadata={
                    "plan_id": plan['id'],
                    "features": plan['features'],
                    "cta": plan['cta'],
                    "featured": plan['featured']
                }
            )

        # 2. Check for matching Price
        prices = stripe.Price.list(product=product.id, active=True)
        matching_price = None
        for p in prices.data:
            if p.unit_amount == plan['amount'] and p.currency == plan['currency']:
                matching_price = p
                break
        
        if matching_price:
            print(f"  💰 Price found for {plan['name']}: {plan['amount']/100} {plan['currency'].upper()}")
        else:
            print(f"  🆕 Creating new Price for {plan['name']}: {plan['amount']/100} {plan['currency'].upper()}")
            stripe.Price.create(
                unit_amount=plan['amount'],
                currency=plan['currency'],
                recurring={"interval": plan['interval']},
                product=product.id,
            )

    print("✅ Sync Complete!")

if __name__ == "__main__":
    if not os.getenv("STRIPE_SECRET_KEY"):
        print("❌ Error: STRIPE_SECRET_KEY not found in .env")
    else:
        sync_plans()
