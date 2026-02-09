import stripe
import os
from dotenv import load_dotenv

load_dotenv()
stripe.api_key = os.getenv("STRIPE_KEY")

def setup_addon():
    print("Checking for existing AI Workspace Add-on...")
    products = stripe.Product.list(active=True, limit=100)
    
    addon_product = None
    for p in products.data:
        if p.metadata.get('addon_key') == 'ai_workspace':
            addon_product = p
            break
    
    if addon_product:
        print(f"Found existing product: {addon_product.name} ({addon_product.id})")
    else:
        print("Creating AI Workspace Add-on product...")
        addon_product = stripe.Product.create(
            name="AI Workspace Add-on",
            description="Unlock powerful AI-driven insights and chat.",
            metadata={
                "addon_key": "ai_workspace",
                "trial_days": "1"
            }
        )
        print(f"Created product: {addon_product.id}")

    # Check for price
    prices = stripe.Price.list(product=addon_product.id, active=True, limit=10)
    
    target_price = None
    for p in prices.data:
        if p.unit_amount == 3000 and p.currency == 'gbp':
            target_price = p
        else:
            # Deactivate incorrect/old prices
            print(f"Deactivating old price: {p.id} ({p.unit_amount/100} {p.currency})")
            stripe.Price.modify(p.id, active=False)

    if not target_price:
        print("Creating £30.00/month price...")
        price = stripe.Price.create(
            product=addon_product.id,
            unit_amount=3000,
            currency="gbp",
            recurring={"interval": "month"},
            metadata={"plan_tier_id": "ai_addon"} 
        )
        print(f"Created price: {price.id}")
    else:
        print(f"Found existing correct price: {target_price.id}")

if __name__ == "__main__":
    setup_addon()
