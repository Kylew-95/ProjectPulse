from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import stripe
import os
from dotenv import load_dotenv

# Load environment variables explicitly
load_dotenv()

stripe.api_key = os.getenv("STRIPE_KEY")
app = FastAPI()

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/products")
async def get_products():
    try:
        # Fetch active products from Stripe
        products = stripe.Product.list(active=True)
        results = []
        for product in products.data:
            # Fetch the default price for the product
            prices = stripe.Price.list(product=product.id, active=True, limit=1)
            price = prices.data[0] if prices.data else None
            
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
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/create-checkout-session")
async def create_checkout_session(data: dict):
    try:
        print(f"DEBUG create_checkout_session data: {data}")
        price_id = data.get("price_id")
        customer_email = data.get("email")
        user_id = data.get("user_id")
        
        # Retrieve the price to check for product metadata (trial_days)
        price = stripe.Price.retrieve(price_id, expand=['product'])
        product = price.product
        
        session_params = {
            'payment_method_types': ['card'],
            'customer_email': customer_email,
            'line_items': [{
                'price': price_id,
                'quantity': 1,
            }],
            'mode': 'subscription',
            'success_url': f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/dashboard?success=true",
            'cancel_url': f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/pricing?canceled=true",
            'metadata': {
                'plan_id': product.metadata.get('plan_id'),
                'user_id': user_id
            }
        }

        # Check for trial_days in metadata
        trial_days = product.metadata.get('trial_days')
        if trial_days and int(trial_days) > 0:
            # Enforce One-Time Trial Logic:
            # Check if this customer email already exists in Stripe and has ANY subscription history
            customers = stripe.Customer.list(email=customer_email, limit=1)
            
            has_prior_subscription = False
            if customers.data:
                customer = customers.data[0]
                # Check for any subscriptions (active, canceled, past due, etc.)
                # We check 'all' status to catch previous trials that were canceled or expired
                subscriptions = stripe.Subscription.list(customer=customer.id, status='all', limit=1)
                if subscriptions.data:
                    has_prior_subscription = True

            if not has_prior_subscription:
                session_params['subscription_data'] = {
                    'trial_period_days': int(trial_days)
                }
            else:
                 print(f"User {customer_email} has a prior subscription. Trial skipped.")

        session = stripe.checkout.Session.create(**session_params)
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/create-portal-session")
async def create_portal_session(data: dict):
    try:
        customer_id = data.get("customer_id") # We'll need to store Stripe customer IDs in profiles
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/dashboard/settings/subscription",
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv('STRIPE_WEBHOOK_SECRET')
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail='Invalid payload')
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail='Invalid signature')

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        print(f"WEBHOOK: Session {session.get('id')} completed.", flush=True)
        
        # Retrieve User ID and Plan ID from metadata
        metadata = session.get('metadata', {})
        plan_id = metadata.get('plan_id')
        user_id = metadata.get('user_id')
        
        print(f"WEBHOOK DEBUG: UserID: {user_id}, PlanID: {plan_id}. Metadata: {metadata}", flush=True)

        if plan_id and user_id:
            print(f"💰 Payment successful. Updating...", flush=True)
            
            # Fetch Subscription Details
            subscription_id = session.get('subscription')
            trial_start = None
            trial_end = None
            
            if subscription_id:
                try:
                    sub = stripe.Subscription.retrieve(subscription_id)
                    if sub.status == 'trialing':
                        from datetime import datetime
                        trial_start = datetime.fromtimestamp(sub.trial_start).isoformat() if sub.trial_start else None
                        trial_end = datetime.fromtimestamp(sub.trial_end).isoformat() if sub.trial_end else None
                except Exception as e:
                    print(f"Error fetching subscription: {e}", flush=True)

            # Update Supabase
            from supabase import create_client, Client
            url: str = os.getenv("SUPABASE_URL")
            
            # Robust Key Loading: Try Service Role first, then generic Key
            key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
            
            if not key:
                print("❌ WEBHOOK CRASH: No SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY found in .env", flush=True)
                return {"status": "error", "message": "Backend Config Error"}

            supabase: Client = create_client(url, key)

            update_data = {
                'id': user_id,
                'subscription_tier': plan_id,
                'updated_at': 'now()',
                'trial_start': trial_start,
                'trial_end': trial_end,
                'status': 'active' # Forced active for now
            }

            # Use upsert to create profile if it's missing (failsafe)
            response = supabase.table('profiles').upsert(update_data).execute()
            print(f"✅ WEBHOOK UPDATE SUCCESS: {response}", flush=True)
        else:
            print("❌ WEBHOOK ERROR: User ID or Plan ID missing in metadata.", flush=True)
    else:
        print(f"WEBHOOK: Ignored event type {event['type']}", flush=True)

    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
