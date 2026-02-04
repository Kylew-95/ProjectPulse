import stripe
import os
from dotenv import load_dotenv

load_dotenv()
stripe.api_key = os.getenv("STRIPE_KEY")

def get_products():
    try:
        # Fetch active products from Stripe
        products = stripe.Product.list(active=True)
        results = []
        print(f"DEBUG: Found {len(products.data)} active products")
        for product in products.data:
            # Fetch the default price for the product
            prices = stripe.Price.list(product=product.id, active=True, limit=1)
            price = prices.data[0] if prices.data else None
            
            print(f"DEBUG: Product: {product.name}, Price: {price.id if price else 'NONE'}")
            
            results.append({
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "price_id": price.id if price else None,
                "price": price.unit_amount / 100 if price else 0,
                "currency": price.currency if price else "gbp",
                "metadata": product.metadata
            })
        return sorted(results, key=lambda x: x['price'])
    except Exception as e:
        print(f"ERROR: {e}")
        return []

if __name__ == "__main__":
    products = get_products()
    print("--- RESULTS ---")
    for p in products:
        print(p)
