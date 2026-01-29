
import os
import stripe
from dotenv import load_dotenv

load_dotenv()
stripe.api_key = os.getenv("STRIPE_KEY")

def restore():
    print("Checking products...")
    all_products = stripe.Product.list(limit=100)
    existing_map = {p.name: p for p in all_products.data}
    
    plans = [
        {'name': 'Starter', 'price': 1800, 'meta': {'plan_tier_id': 'starter', 'tickets': '2,000 tickets/mo'}},
        {'name': 'Pro', 'price': 2400, 'meta': {'plan_tier_id': 'pro', 'tickets': '10,000 tickets/mo', 'trial_days': '7', 'featured': 'true'}},
        {'name': 'Enterprise', 'price': 12000, 'meta': {'plan_tier_id': 'enterprise', 'tickets': 'Unlimited tickets'}}
    ]
    
    for plan in plans:
        name = plan['name']
        if name in existing_map:
            p = existing_map[name]
            if not p.active:
                print(f"Reactivating {name}...")
                stripe.Product.modify(p.id, active=True)
            else:
                print(f"{name} is already active.")
        else:
            print(f"Creating {name}...")
            p = stripe.Product.create(name=name, metadata=plan['meta'], description=f"{name} Plan")
            stripe.Price.create(product=p.id, unit_amount=plan['price'], currency='gbp', recurring={'interval': 'month'})
            print(f"Created {name} and Price.")

if __name__ == "__main__":
    restore()
