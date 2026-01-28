import os
from stripe import StripeClient
from dotenv import load_dotenv

load_dotenv()
client = StripeClient(os.getenv("STRIPE_KEY"))

price_id = 'price_1SuKsWK4HSIkuH8O2N0JpMJt'

print(f"--- START TEST ---")
try:
    print(f"Testing client.prices.retrieve(params={{'expand': ['product']}})...")
    price = client.prices.retrieve(price_id, params={"expand": ['product']})
    print("SUCCESS: params={'expand': ...} worked!")
except Exception as e:
    print(f"ERROR with params: {e}")

try:
    print(f"\nTesting client.prices.retrieve(expand=['product'])...")
    price = client.prices.retrieve(price_id, expand=['product'])
    print("SUCCESS: expand=... worked!")
except Exception as e:
    print(f"EXPECTED ERROR with expand=...: {e}")
print(f"--- END TEST ---")
