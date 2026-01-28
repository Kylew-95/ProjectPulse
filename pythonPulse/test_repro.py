import os
import stripe
from stripe import StripeClient
from dotenv import load_dotenv

load_dotenv()
client = StripeClient(os.getenv("STRIPE_KEY"))

try:
    price_id = 'price_1SuKsWK4HSIkuH8O2N0JpMJt'
    print(f"Testing client.prices.retrieve('{price_id}', params={{'expand': ['product']}})...")
    price = client.prices.retrieve(price_id, params={"expand": ['product']})
    print("Success with params={'expand': ...}")
    print(f"Product expanded? {hasattr(price, 'product') and price.product is not None}")

except Exception as e:
    print(f"Failed with params={{'expand': ...}}: {e}")

try:
    print(f"\nTesting client.prices.retrieve('{price_id}', expand=['product'])...")
    price = client.prices.retrieve(price_id, expand=['product'])
    print("Success with expand=...")
except Exception as e:
    print(f"Failed with expand=...: {e}")
