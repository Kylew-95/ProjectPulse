import stripe
import os
from dotenv import load_dotenv

load_dotenv()
stripe.api_key = os.getenv("STRIPE_KEY")

def update_price():
    print("Searching for AI Workspace Add-on...")
    products = stripe.Product.list(active=True, limit=100)
    
    addon_product = None
    for p in products.data:
        if p.metadata.get('addon_key') == 'ai_workspace':
            addon_product = p
            break
    
    if not addon_product:
        print("Error: AI Workspace Add-on product not found!")
        return

    print(f"Found product: {addon_product.name} ({addon_product.id})")
    
    # List active prices
    prices = stripe.Price.list(product=addon_product.id, active=True, limit=10)
    
    TARGET_AMOUNT = 3000 # £30.00
    
    current_price = prices.data[0] if prices.data else None
    
    if current_price:
        if current_price.unit_amount == TARGET_AMOUNT:
            print("Price is already £30.00. No changes needed.")
            return
        else:
            print(f"Current price is {current_price.unit_amount/100} {current_price.currency.upper()}. Archiving...")
            stripe.Price.modify(current_price.id, active=False)
            print("Old price archived.")
            
    print("Creating new price: £30.00...")
    new_price = stripe.Price.create(
        product=addon_product.id,
        unit_amount=TARGET_AMOUNT,
        currency="gbp",
        recurring={"interval": "month"},
        metadata={"plan_tier_id": "ai_addon"}
    )
    print(f"Created new price: {new_price.id}")

if __name__ == "__main__":
    update_price()
