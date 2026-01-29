from fastapi import FastAPI, HTTPException, Request

from fastapi.middleware.cors import CORSMiddleware
import stripe
import os
import time
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
        
        # 1. Try to find the existing Stripe Customer ID from Supabase
        stripe_customer_id = None
        try:
            from supabase import create_client
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
            supabase_client = create_client(supabase_url, supabase_key)
            
            profile_res = supabase_client.table('profiles').select('stripe_customer_id').eq('id', user_id).single().execute()
            if profile_res.data:
                stripe_customer_id = profile_res.data.get('stripe_customer_id')
                print(f"DEBUG CHECKOUT: Found existing stripe_customer_id: {stripe_customer_id}")
        except Exception as e:
            print(f"DEBUG CHECKOUT: Error fetching customer_id from DB: {e}")

        # Retrieve the price to check for product metadata (trial_days)
        price = stripe.Price.retrieve(price_id, expand=['product'])
        product = price.product
        
        # Extract trial days from product metadata (default to 0)
        trial_days = product.metadata.get('trial_days', 0)
        
        session_params = {
            'payment_method_types': ['card'],
            'line_items': [{
                'price': price_id,
                'quantity': 1,
            }],
            'mode': 'subscription',
            'success_url': f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/dashboard?success=true",
            'cancel_url': f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/pricing?canceled=true",
            'metadata': {
                'plan_tier_id': product.metadata.get('plan_tier_id'),
                'user_id': user_id
            },
            'subscription_data': {
                'metadata': {
                    'plan_tier_id': product.metadata.get('plan_tier_id'),
                    'user_id': user_id
                }
            }
        }

        # Use existing customer if found, else use email
        if stripe_customer_id:
            session_params['customer'] = stripe_customer_id
        else:
            session_params['customer_email'] = customer_email

        if trial_days and int(trial_days) > 0:
            print(f"DEBUG CHECKOUT: Target product has {trial_days} trial days. Checking for prior subs for {customer_email}...")
            
            # Enforce One-Time Trial Logic (Robust Check)
            # 1. Search ALL customers with this email to avoid duplicates hiding history
            customers = stripe.Customer.list(email=customer_email, limit=100)
            
            has_prior_subscription = False
            active_sub = None

            if customers.data:
                for customer in customers.data:
                    # Check for any subscriptions (active, canceled, past due, etc.)
                    subscriptions = stripe.Subscription.list(customer=customer.id, status='all', limit=100)
                    for sub in subscriptions.data:
                        # If user has an ACTIVE or TRIALING subscription right now
                        if sub.status in ['active', 'trialing']:
                            active_sub = sub
                        
                        # Check for ANY history
                        if sub.status in ['active', 'trialing', 'canceled', 'past_due', 'unpaid', 'incomplete_expired']:
                             has_prior_subscription = True
                             print(f"DEBUG: Found prior sub {sub.id} (status={sub.status}) for customer {customer.id}")
                    
                    if has_prior_subscription: 
                        break

            if active_sub:
                print(f"DEBUG CHECKOUT: Active/Trialing subscription found for {customer_email}. Switch initiated.")
                # We allow the user to proceed. The Webhook will handle canceling the OLD one.

            if not has_prior_subscription:
                print(f"DEBUG CHECKOUT: Applying {trial_days} days trial for {customer_email}.")
                if 'subscription_data' not in session_params:
                    session_params['subscription_data'] = {}
                session_params['subscription_data']['trial_period_days'] = int(trial_days)
            else:
                 print(f"User {customer_email} has a prior subscription. FORCE SKIPPING TRIAL.")
                 # To skip trial, ensure NO trial params are present
                 if 'subscription_data' in session_params:
                     # Remove any trial_period_days or trial_end from params
                     session_params['subscription_data'].pop('trial_period_days', None)
                     session_params['subscription_data'].pop('trial_end', None)

        print(f"DEBUG CHECKOUT: Creating session with params: {session_params}")
        session = stripe.checkout.Session.create(**session_params)
        return {"url": session.url}
    except Exception as e:
        print(f"DEBUG CHECKOUT ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/create-portal-session")
async def create_portal_session(data: dict):
    try:
        customer_id = data.get("customer_id")
        email = data.get("email")

        if not customer_id and email:
            # Fallback: find customer by email
            customers = stripe.Customer.list(email=email, limit=1)
            if customers.data:
                customer_id = customers.data[0].id

        if not customer_id:
             raise HTTPException(status_code=400, detail="Customer ID not found. Please contact support.")

        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/dashboard/settings/subscription",
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/cancel-subscription")
async def cancel_subscription(data: dict):
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email required")

    try:
        # 1. Find all customers with this email to handle potential duplicates
        customers = stripe.Customer.list(email=email, limit=20)
        if not customers.data:
            raise HTTPException(status_code=404, detail="No customer found")
        
        target_sub = None
        
        # 2. Find the first Active or Trialing subscription
        for cust in customers.data:
            subs = stripe.Subscription.list(customer=cust.id, status='all', limit=10)
            for sub in subs.data:
                if sub.status in ['active', 'trialing']:
                    target_sub = sub
                    break
            if target_sub:
                break
                
        if not target_sub:
             raise HTTPException(status_code=404, detail="No active subscription found")
             
        # 3. Cancel Immediately
        deleted_sub = stripe.Subscription.delete(target_sub.id)
        
        # 4. Immediate Supabase Update
        user_id = target_sub.metadata.get('user_id')
        print(f"DEBUG CANCEL: Retrieved user_id from metadata: {user_id}", flush=True)
        
        if not user_id:
             # Fallback lookup by email
             try:
                from supabase import create_client
                url: str = os.getenv("SUPABASE_URL")
                key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
                supabase_admin = create_client(url, key)
                response = supabase_admin.auth.admin.list_users()
                users = getattr(response, 'users', response if isinstance(response, list) else [])
                for u in users:
                    if u.email == email:
                        user_id = u.id
                        print(f"DEBUG CANCEL: Found user_id {user_id} via Supabase Admin search.", flush=True)
                        break
             except Exception as auth_err:
                 print(f"⚠️ CANCEL AUTH LOOKUP FAILED: {auth_err}", flush=True)

        if user_id:
            try:
                from supabase import create_client
                url = os.getenv("SUPABASE_URL")
                key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
                supabase_admin = create_client(url, key)

                update_data = {
                    'id': user_id,
                    'status': 'canceled',
                    'subscription_tier': 'free', 
                    'updated_at': 'now()'
                }
                supabase_admin.table('profiles').update(update_data).eq('id', user_id).execute()
                print(f"✅ CANCEL: Force updated profile {user_id} to canceled.", flush=True)
                
            except Exception as db_err:
                 print(f"⚠️ CANCEL DB UPDATE FAILED: {db_err}", flush=True)
        
        return {
            "status": "success", 
            "message": "Subscription canceled immediately.", 
            "sub_status": deleted_sub.status
        }

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=e.http_status, detail=str(e))
    except Exception as e:
        print(f"Cancel Error: {e}") 
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv('STRIPE_WEBHOOK_SECRET')
        )
        print(f"DEBUG WEBHOOK: Received event type '{event['type']}'", flush=True)
    except ValueError as e:
        print(f"DEBUG WEBHOOK ERROR (Payload): {e}")
        raise HTTPException(status_code=400, detail='Invalid payload')
    except stripe.error.SignatureVerificationError as e:
        print(f"DEBUG WEBHOOK ERROR (Signature): {e}")
        raise HTTPException(status_code=400, detail='Invalid signature')

    from supabase import create_client, Client
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    if not key:
        print("❌ WEBHOOK CRASH: No SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY found in .env", flush=True)
        return {"status": "error", "message": "Backend Config Error"}
    supabase: Client = create_client(url, key)

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        print(f"WEBHOOK: Session {session.get('id')} completed.", flush=True)
        
        # Retrieve User ID and Plan Tier ID from metadata
        metadata = session.get('metadata', {})
        plan_tier_id = metadata.get('plan_tier_id')
        user_id = metadata.get('user_id')
        
        print(f"WEBHOOK DEBUG: UserID: {user_id}, PlanTierID: {plan_tier_id}.", flush=True)

        if plan_tier_id and user_id:
            print(f"💰 Payment successful. Processing Subscription Switch Logic...", flush=True)
            
            stripe_customer_id = session.get('customer')
            new_subscription_id = session.get('subscription')
            
            # --- AUTO-CANCEL OLD SUBSCRIPTIONS (Strict) ---
            if stripe_customer_id and new_subscription_id:
                try:
                    # List all active/trialing subs for this customer
                    existing_subs = stripe.Subscription.list(
                        customer=stripe_customer_id, 
                        status='all', 
                        limit=20
                    )
                    
                    for sub in existing_subs.data:
                        # If subscription is active/trialing AND it's NOT the one we just created
                        if sub.status in ['active', 'trialing'] and sub.id != new_subscription_id:
                            print(f"🔄 SWITCHING: Found old subscription {sub.id} ({sub.status}). Canceling IMMEDIATELY...", flush=True)
                            try:
                                # Explicit DELETE implies immediate cancellation
                                stripe.Subscription.delete(sub.id)
                                print(f"✅ SWITCHING: Old subscription {sub.id} deleted.", flush=True)
                            except Exception as delete_err:
                                print(f"⚠️ SWITCHING: Failed to delete sub {sub.id}: {delete_err}", flush=True)
                            
                except Exception as e:
                    print(f"⚠️ SWITCHING ERROR: Failed to assistant cancel old subscriptions: {e}", flush=True)
            # -------------------------------------
            
            # Fetch Subscription Details
            subscription_id = session.get('subscription')
            trial_start = None
            trial_end = None
            
            if subscription_id:
                try:
                    sub = stripe.Subscription.retrieve(subscription_id)
                    status = sub.status
                    if sub.status == 'trialing':
                        from datetime import datetime
                        trial_start = datetime.fromtimestamp(sub.trial_start).isoformat() if sub.trial_start else None
                        trial_end = datetime.fromtimestamp(sub.trial_end).isoformat() if sub.trial_end else None
                except Exception as e:
                    print(f"Error fetching subscription: {e}", flush=True)
                    status = 'active' # Fallback
            else:
                status = 'active'

            # Update Supabase
            stripe_customer_id = session.get('customer')

            update_data = {
                'id': user_id,
                'stripe_customer_id': stripe_customer_id,
                'subscription_tier': plan_tier_id,
                'updated_at': 'now()',
                'trial_start': trial_start,
                'trial_end': trial_end,
                'status': status
            }

            # Use upsert to create profile if it's missing (failsafe)
            response = supabase.table('profiles').upsert(update_data).execute()
            print(f"✅ WEBHOOK UPDATE SUCCESS: {response}", flush=True)
        else:
            print("❌ WEBHOOK ERROR: User ID or Plan Tier ID missing in metadata.", flush=True)

    elif event['type'] == 'customer.subscription.updated':
        sub = event['data']['object']
        # If user cancels mid-cycle, Stripe sets cancel_at_period_end = True
        # but status remains 'active'.
        # We want to show 'Canceled' badge in UI.
        
        user_id = sub.get('metadata', {}).get('user_id')
        if user_id:
             new_status = sub.get('status')
             if sub.get('cancel_at_period_end'):
                 new_status = 'canceled' # Force our DB to say canceled so UI shows Red Badge
             
             update_data = {
                'id': user_id,
                'status': new_status,
                'updated_at': 'now()'
             }
             supabase.table('profiles').upsert(update_data).execute()
             print(f"✅ WEBHOOK: Profile {user_id} updated via sync (Cancel={sub.get('cancel_at_period_end')}).", flush=True)

    elif event['type'] == 'customer.subscription.deleted':
        sub = event['data']['object']
        print(f"WEBHOOK: Subscription {sub.get('id')} deleted.", flush=True)
        
        user_id = sub.get('metadata', {}).get('user_id')
        if user_id:
            update_data = {
                'id': user_id,
                'status': 'canceled',
                'subscription_tier': 'free', 
                'updated_at': 'now()'
            }
            supabase.table('profiles').upsert(update_data).execute()
            print(f"✅ WEBHOOK: Profile {user_id} cancelled.", flush=True)
    
    else:
        print(f"WEBHOOK: Ignored event type {event['type']}", flush=True)

    return {"status": "success"}


    return {"status": "success"}

@app.post("/sync-subscription")
async def sync_subscription(data: dict):
    try:
        email = data.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Email required")
            
        # 1. Find Customer
        customers = stripe.Customer.list(email=email, limit=100)
        target_sub = None
        
        # 2. Find Subscription (Prioritize 'active')
        sub_list = []
        for cust in customers.data:
            subs = stripe.Subscription.list(customer=cust.id, limit=10)
            sub_list.extend(subs.data)
        
        # Sort so 'active' comes before 'trialing' etc.
        def sub_priority(s):
            if s.status == 'active': return 0
            if s.status == 'trialing': return 1
            if s.status in ['past_due', 'unpaid']: return 2
            return 3
        
        sorted_subs = sorted(sub_list, key=sub_priority)
        if sorted_subs:
            target_sub = sorted_subs[0]
            
        # 3. Determine Status
        status = 'free'
        trial_end = None
        
        if target_sub:
            status = target_sub.status
            # Logic: If canceling at period end, we treat it as 'cancelled' for the DB/UI
            if target_sub.cancel_at_period_end:
                status = 'cancelled'
            
            if target_sub.trial_end:
                from datetime import datetime
                try:
                     trial_end = datetime.fromtimestamp(target_sub.trial_end).isoformat()
                except:
                     trial_end = None

        # 4. Update Supabase
        # Always resolve user_id by email from Supabase first to ensure we target the valid, current user
        # (Handling case where user re-signed up but Stripe has old ID)
        current_user_id = data.get("user_id") # Use ID provided by frontend if available (SUB ID)
        
        if not current_user_id:
             try:
                 from supabase import create_client
                 url: str = os.getenv("SUPABASE_URL")
                 key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
                 supabase_admin = create_client(url, key)
                 
                 response = supabase_admin.auth.admin.list_users()
                 users = getattr(response, 'users', response if isinstance(response, list) else [])
                 for u in users:
                     if u.email == email:
                         current_user_id = u.id
                         print(f"DEBUG SYNC: Resolved current user_id {current_user_id} via Supabase Admin search.", flush=True)
                         break
             except Exception as auth_err:
                 print(f"⚠️ SYNC AUTH LOOKUP FAILED: {auth_err}", flush=True)

        if not current_user_id and target_sub:
             # Fallback to metadata ONLY if we couldn't find user by email/frontend
             current_user_id = target_sub.metadata.get('user_id')

        if current_user_id:
             user_id = current_user_id # Use the resolved ID
             from supabase import create_client
             url: str = os.getenv("SUPABASE_URL")
             key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
             supabase = create_client(url, key)
             
             update_data = {
                 'id': user_id,
                 'status': status,
                 'updated_at': 'now()',
             }
             
             # Sync the tier if available in metadata
             plan_tier_id = target_sub.metadata.get('plan_tier_id') if target_sub else None
             
             # Fallback: If plan_tier_id is missing but we have a subscription, check the Product metadata
             if target_sub and not plan_tier_id:
                 try:
                     print(f"DEBUG SYNC: plan_tier_id missing on subscription {target_sub.id}. Fetching product...", flush=True)
                     # target_sub.plan.product is usually an ID string unless expanded
                     product_id = target_sub.plan.product
                     if product_id:
                         prod = stripe.Product.retrieve(product_id)
                         print(f"DEBUG SYNC: Product {product_id} metadata: {prod.metadata}", flush=True)
                         plan_tier_id = prod.metadata.get('plan_tier_id')
                         print(f"DEBUG SYNC: Recovered plan_tier_id '{plan_tier_id}' from product {product_id}", flush=True)
                 except Exception as e:
                     print(f"⚠️ SYNC PRODUCT LOOKUP FAILED: {e}", flush=True)

             if plan_tier_id:
                 update_data['subscription_tier'] = plan_tier_id
                 # If we have a paid tier, we'll treat the status as 'active' for the UI/DB
                 # unless it's explicitly cancelled at period end
                 if status != 'cancelled':
                     update_data['status'] = 'active'
                 print(f"DEBUG SYNC: Found tier {plan_tier_id} for {user_id}. Status set to: {update_data.get('status', status)}", flush=True)

             if status == 'free' and not plan_tier_id:
                 update_data['subscription_tier'] = 'free' # Explicitly reset tier

             if trial_end:
                 update_data['trial_end'] = trial_end
                 
             supabase.table('profiles').upsert(update_data).execute()
             print(f"✅ SYNC: Force updated profile {user_id} to {status}", flush=True)
             return {"status": "success", "profile_status": status}
        
        return {"status": "skipped", "message": "No linked user_id found"}

    except Exception as e:
        print(f"Sync Error: {e}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/send-invite")
async def send_invite(data: dict):
    email = data.get("email")
    role = data.get("role")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    try:
        # Standard SMTP Configuration (Gmail Example)
        SMTP_SERVER = "smtp.gmail.com"
        SMTP_PORT = 587
        SENDER_EMAIL = os.getenv("EMAIL_USER")
        SENDER_PASSWORD = os.getenv("EMAIL_PASSWORD") 
        
        if not SENDER_EMAIL or not SENDER_PASSWORD:
             raise HTTPException(status_code=500, detail="Server email configuration missing (EMAIL_USER/EMAIL_PASSWORD)")

        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        invite_link = f"{frontend_url}/signup?email={email}"
        
        # Construct Email
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        msg = MIMEMultipart()
        msg['From'] = f"Project Pulse <{SENDER_EMAIL}>"
        msg['To'] = email
        msg['Subject'] = "You've been invited to join the team on Project Pulse!"

        html_content = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">Welcome to the Team!</h1>
            <p>You've been invited to join Project Pulse as a <strong>{role}</strong>.</p>
            <p>Click the button below to accept your invitation and get started.</p>
            <a href="{invite_link}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px;">Accept Invitation</a>
            <p style="margin-top: 24px; color: #666; font-size: 12px;">If you were not expecting this invite, please ignore this email.</p>
        </div>
        """
        
        msg.attach(MIMEText(html_content, 'html'))

        # Send Email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()

        print(f"✅ EMAIL (SMTP): Invite sent to {email}", flush=True)
        return {"status": "success"}
        
    except Exception as e:
        print(f"❌ EMAIL ERROR: {e}", flush=True)
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
