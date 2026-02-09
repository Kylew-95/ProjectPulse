import stripe
import os
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()
stripe.api_key = os.getenv("STRIPE_KEY")

def run_simulation():
    print("--- STARTING STRIPE PRORATION SIMULATION ---")
    
    # 1. Create a Test Clock (Set to Feb 1st, 2026)
    start_date = datetime(2026, 2, 1, 10, 0)
    start_timestamp = int(start_date.timestamp())
    
    print(f"Creating Test Clock starting at: {start_date}")
    clock = stripe.test_helpers.TestClock.create(
        frozen_time=start_timestamp,
        name="Billing Alignment Test Clock"
    )
    
    # 2. Create a Customer attached to this clock
    customer = stripe.Customer.create(
        email="test_proration@example.com",
        name="Proration Tester",
        test_clock=clock.id,
        source="tok_visa" # Essential for subscription creation in simulation
    )
    print(f"Created Customer: {customer.id}")

    # 3. Subscribe to Pro Plan (£24/mo)
    # price_1Sz1OKK4HSIkuH8OwHVYNROe
    pro_price_id = "price_1Sz1OKK4HSIkuH8OwHVYNROe"
    sub = stripe.Subscription.create(
        customer=customer.id,
        items=[{"price": pro_price_id}],
    )
    print(f"Subscribed to Pro Plan. Subscription: {sub.id}")

    # 4. Advance time to Feb 15th (14 days later)
    advance_to = start_date + timedelta(days=14)
    advance_timestamp = int(advance_to.timestamp())
    print(f"Advancing Test Clock to: {advance_to} (Approx halfway)...")
    
    stripe.test_helpers.TestClock.advance(
        clock.id,
        frozen_time=advance_timestamp
    )

    # Wait for clock to finish advancing (Stripe simulation takes a few seconds)
    print("Waiting for Stripe to process time shift...", end="", flush=True)
    while True:
        clock = stripe.test_helpers.TestClock.retrieve(clock.id)
        if clock.status == "ready":
            break
        print(".", end="", flush=True)
        time.sleep(2)
    print(" Done.")

    # 5. Add AI Workspace (£30/mo) with proration_behavior='always_invoice'
    # price_1Sz1NtK4HSIkuH8ORi6DTmVk
    addon_price_id = "price_1Sz1NtK4HSIkuH8ORi6DTmVk"
    
    print(f"Adding AI Workspace Add-on (£30/mo) with proration_behavior='always_invoice'...")
    
    # Retrieve current items to add to them (bundling)
    # sub_items = stripe.SubscriptionItem.list(subscription=sub.id)
    # new_items = [{'id': item.id, 'price': item.price.id} for item in sub_items.data]
    # new_items.append({'price': addon_price_id})
    
    # Simplified update call
    updated_sub = stripe.Subscription.modify(
        sub.id,
        proration_behavior='always_invoice',
        items=[
            # We don't need to pass existing IDs if we use the specific update format, 
            # but to be safe and consistent with our app's logic:
            {"price": addon_price_id}
        ],
    )

    # 6. Check the last invoice generated
    invoices = stripe.Invoice.list(customer=customer.id, limit=5)
    latest_invoice = invoices.data[0] # Should be the proration invoice

    print("\n--- RESULTS ---")
    print(f"Invoice ID: {latest_invoice.id}")
    print(f"Total Amount Charged: £{latest_invoice.amount_paid / 100:.2f}")
    
    print("\nLine Items:")
    for item in latest_invoice.lines.data:
        print(f"- {item.description}: £{item.amount / 100:.2f}")

    print("\nCheck the 'Proration' lines above. You should see a charge for the remaining ~14 days of the AI Workspace.")

if __name__ == "__main__":
    run_simulation()
