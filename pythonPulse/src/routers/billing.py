from fastapi import APIRouter, HTTPException, Request
import stripe
import os
import time
from dotenv import load_dotenv

load_dotenv()
stripe.api_key = os.getenv("STRIPE_KEY")

router = APIRouter()

@router.get("/products")
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

@router.post("/create-checkout-session")
async def create_checkout_session(data: dict):
    try:
        print(f"DEBUG create_checkout_session data: {data}")
        price_id = data.get("price_id")
        customer_email = data.get("email")
        user_id = data.get("user_id")
        
        # 0. EARLY RETRIEVAL: specific for add-on check
        # Retrieve the price to check for product metadata (trial_days, addon_key)
        price = stripe.Price.retrieve(price_id, expand=['product'])
        product = price.product
        is_addon = product.metadata.get('addon_key') is not None
        
        # 1. Try to find the existing Stripe Customer ID and last plan change from Supabase
        stripe_customer_id = None
        last_plan_change_at = None
        try:
            from supabase import create_client
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
            supabase_client = create_client(supabase_url, supabase_key)
            
            profile_res = supabase_client.table('profiles').select('stripe_customer_id, last_plan_change_at').eq('id', user_id).single().execute()
            if profile_res.data:
                stripe_customer_id = profile_res.data.get('stripe_customer_id')
                last_plan_change_at_str = profile_res.data.get('last_plan_change_at')
                
                # Enforce 30-day Cooldown (SKIP FOR ADD-ONS)
                if not is_addon and last_plan_change_at_str:
                    from datetime import datetime, timezone, timedelta
                    # Parse as UTC-aware datetime
                    last_change = datetime.fromisoformat(last_plan_change_at_str.replace('Z', '+00:00'))
                    if datetime.now(timezone.utc) - last_change < timedelta(days=30):
                         diff = timedelta(days=30) - (datetime.now(timezone.utc) - last_change)
                         days_left = diff.days
                         raise HTTPException(status_code=403, detail=f"You can only change plans once every 30 days. Please try again in {days_left} days.")
                
                print(f"DEBUG CHECKOUT: Found existing stripe_customer_id: {stripe_customer_id}")
        except Exception as e:
            if isinstance(e, HTTPException): raise e
            print(f"DEBUG CHECKOUT: Error fetching customer_id/cooldown from DB: {e}")

        # Extract trial days from product metadata (default to 0)
        trial_days = product.metadata.get('trial_days', 0)
        
        default_success_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/dashboard?success=true"
        default_cancel_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/pricing?canceled=true"

        session_params = {
            'payment_method_types': ['card'],
            'line_items': [{
                'price': price_id,
                'quantity': 1,
            }],
            'mode': 'subscription',
            'success_url': data.get('success_url', default_success_url),
            'cancel_url': data.get('cancel_url', default_cancel_url),
            'metadata': {
                'plan_tier_id': product.metadata.get('plan_tier_id'),
                'user_id': user_id,
                'addon_key': product.metadata.get('addon_key') # Explicitly pass addon_key
            },
            'subscription_data': {
                'metadata': {
                    'plan_tier_id': product.metadata.get('plan_tier_id'),
                    'user_id': user_id,
                    'addon_key': product.metadata.get('addon_key')
                }
            }
        }

        # Use existing customer if found, else use email
        if stripe_customer_id:
            session_params['customer'] = stripe_customer_id
        else:
            session_params['customer_email'] = customer_email

        # --- ADD-ON LOGIC: ALIGNED BILLING ---
        if is_addon:
             print(f"DEBUG CHECKOUT: Detected Add-on purchase: {product.name}. Attempting to align billing.")
             
             if stripe_customer_id:
                 # Check for existing active or trialing main subscription
                 existing_subs = stripe.Subscription.list(customer=stripe_customer_id, limit=20)
                 main_sub = None
                 for sub in existing_subs.data:
                     # A "main" sub is one that isn't an addon itself and is active or trialing
                     if not sub.metadata.get('addon_key') and sub.status in ['active', 'trialing']:
                         main_sub = sub
                         break
                 
                 if main_sub:
                     print(f"DEBUG CHECKOUT: Found main subscription {main_sub.id}. Aligning add-on.")
                     # Update Checkout Session to handle subscription update
                     session_params['subscription'] = main_sub.id
                     session_params['proration_behavior'] = 'always_invoice' # Charge immediately for remaining days
                     
                     # Retrieve existing items to preserve them
                     sub_items = stripe.SubscriptionItem.list(subscription=main_sub.id)
                     
                     # Check if they already have THIS addon on this sub
                     for item in sub_items.data:
                         prod = stripe.Product.retrieve(item.price.product)
                         if prod.metadata.get('addon_key') == product.metadata.get('addon_key'):
                              raise HTTPException(status_code=400, detail=f"You already have {product.name} on your subscription.")

                     # Line items for update must include existing items if we want to KEEP them?
                     # Actually, for subscription updates in Checkout, you can either:
                     # 1. Update the entire list.
                     # 2. Add new items.
                     
                     # The most robust way is to list all items we want to BE there.
                     new_line_items = []
                     for item in sub_items.data:
                         new_line_items.append({
                             'id': item.id, # Keep existing item
                             'price': item.price.id,
                             'quantity': item.quantity
                         })
                     
                     # Add the new add-on
                     new_line_items.append({
                         'price': price_id,
                         'quantity': 1
                     })
                     
                     session_params['line_items'] = new_line_items
                     # mode must be 'subscription' still
                 else:
                     print("DEBUG CHECKOUT: No main subscription found. Creating separate add-on subscription.")
                     # Fallback to separate sub (billing won't be aligned until they move to a plan)
        else:
            # --- STANDARD PLAN LOGIC (Replacement) ---
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

@router.post("/create-portal-session")
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

@router.post("/cancel-subscription")
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
             
        # 3. Cancel at Period End (Phone Bill Logic)
        deleted_sub = stripe.Subscription.modify(
            target_sub.id,
            cancel_at_period_end=True
        )
        
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
                 print(f"Warning: CANCEL AUTH LOOKUP FAILED: {auth_err}", flush=True)

        if user_id:
            try:
                from supabase import create_client
                url = os.getenv("SUPABASE_URL")
                key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
                supabase_admin = create_client(url, key)

                # --- PROTECT SUPER_ADMIN ---
                current_tier = None
                try:
                    profile_res = supabase_admin.table('profiles').select('subscription_tier').eq('id', user_id).single().execute()
                    if profile_res.data:
                        current_tier = profile_res.data.get('subscription_tier')
                except:
                    pass

                if current_tier == 'super_admin':
                    print(f"CANCEL: User {user_id} is 'super_admin'. Skipping status change.", flush=True)
                    return {
                        "status": "success", 
                        "message": "User is a Super Admin. No changes needed.", 
                        "sub_status": "active"
                    }
                # ---------------------------

                update_data = {
                    'id': user_id,
                    'status': 'canceled',
                    'updated_at': 'now()'
                }
                # Only reset tier if NOT super_admin
                if current_tier != 'super_admin':
                    update_data['subscription_tier'] = None
                supabase_admin.table('profiles').update(update_data).eq('id', user_id).execute()
                print(f"CANCEL: Force updated profile {user_id} to canceled.", flush=True)
                
            except Exception as db_err:
                 print(f"Warning: CANCEL DB UPDATE FAILED: {db_err}", flush=True)
        
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

@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    # Support multiple secrets for local vs production transparency
    webhook_secrets = [
        os.getenv('STRIPE_WEBHOOK_SECRET'),
        os.getenv('STRIPE_WEBHOOK_SECRET_LOCAL')  # Fallback for CLI testing
    ]
    webhook_secrets = [s for s in webhook_secrets if s]

    event = None
    last_error = None

    for secret in webhook_secrets:
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, secret)
            break # Success!
        except Exception as e:
            last_error = e
            continue

    if not event:
        print(f"DEBUG WEBHOOK ERROR: Signature verification failed for all secrets. Last error: {last_error}")
        raise HTTPException(status_code=400, detail='Invalid signature or secret mismatch')

    print(f"DEBUG WEBHOOK: Received event type '{event['type']}'", flush=True)

    from supabase import create_client, Client
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    if not key:
        print("WEBHOOK CRASH: No SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY found in .env", flush=True)
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
            print(f"Payment successful. Processing Subscription Switch Logic...", flush=True)
            
            stripe_customer_id = session.get('customer')
            new_subscription_id = session.get('subscription')
            
            # --- AUTO-CANCEL OLD SUBSCRIPTIONS (Strict but Smart) ---
            if stripe_customer_id and new_subscription_id:
                try:
                    # Determine if the NEW subscription is an Add-on
                    new_is_addon = False
                    new_addon_key = metadata.get('addon_key')
                    if not new_addon_key:
                         # Try seeking via product
                         try:
                             line_items = stripe.checkout.Session.list_line_items(session.get('id'), limit=1)
                             if line_items.data:
                                 price = line_items.data[0].price
                                 prod = stripe.Product.retrieve(price.product)
                                 new_addon_key = prod.metadata.get('addon_key')
                         except: pass
                    
                    if new_addon_key:
                        new_is_addon = True
                        print(f"SWITCHING: New subscription is ADD-ON ({new_addon_key}). NOT canceling main plans.", flush=True)

                    # List all active/trialing subs for this customer
                    existing_subs = stripe.Subscription.list(
                        customer=stripe_customer_id, 
                        status='all', 
                        limit=20
                    )
                    
                    for sub in existing_subs.data:
                        # If subscription is active/trialing AND it's NOT the one we just created
                        if sub.status in ['active', 'trialing'] and sub.id != new_subscription_id:
                            
                            # Check if the EXISTING sub is an Add-on
                            existing_addon_key = sub.metadata.get('addon_key')
                            if not existing_addon_key:
                                try:
                                    prod_id = sub.plan.product
                                    if prod_id:
                                        p = stripe.Product.retrieve(prod_id)
                                        existing_addon_key = p.metadata.get('addon_key')
                                except: pass
                            
                            should_cancel = False
                            
                            if new_is_addon:
                                # If buying Add-on, ONLY cancel existing Add-ons of the SAME type (e.g. upgrading add-on tier?)
                                # For now, we assume one add-on of a type allowed.
                                if existing_addon_key == new_addon_key:
                                     should_cancel = True
                                     print(f"SWITCHING: Canceling duplicate Add-on {sub.id}", flush=True)
                            else:
                                # If buying Main Plan, ONLY cancel existing Main Plans. Leave Add-ons alone.
                                if not existing_addon_key:
                                     should_cancel = True
                                     print(f"SWITCHING: Canceling old Main Plan {sub.id}", flush=True)

                            if should_cancel:
                                try:
                                    # Use cancel_at_period_end for 'phone bill' logic
                                    stripe.Subscription.modify(sub.id, cancel_at_period_end=True)
                                    print(f"SWITCHING: Old subscription {sub.id} scheduled for cancellation.", flush=True)
                                except Exception as delete_err:
                                    print(f"Warning: SWITCHING: Failed to delete sub {sub.id}: {delete_err}", flush=True)
                            
                except Exception as e:
                    print(f"Warning: SWITCHING ERROR: Failed to assistant cancel old subscriptions: {e}", flush=True)
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

            # --- PROTECT SUPER_ADMIN ---
            current_tier = None
            try:
                profile_res = supabase.table('profiles').select('subscription_tier').eq('id', user_id).single().execute()
                if profile_res.data:
                    current_tier = profile_res.data.get('subscription_tier')
            except:
                pass
            
            if current_tier == 'super_admin':
                print(f"WEBHOOK: User {user_id} is 'super_admin'. Skipping tier overwrite in checkout.", flush=True)
                plan_tier_id = 'super_admin' # Keep existing
            # ---------------------------

            # Update Supabase
            stripe_customer_id = session.get('customer')

            update_data = {
                'id': user_id,
                'stripe_customer_id': stripe_customer_id,
                'updated_at': 'now()',
                'trial_start': trial_start,
                'trial_end': trial_end,
                'status': 'active' if current_tier == 'super_admin' else status,
                'last_plan_change_at': 'now()' # Update cooldown on successful checkout
            }

            if current_tier != 'super_admin':
                update_data['subscription_tier'] = plan_tier_id

            # Use upsert to create profile if it's missing (failsafe)
            try:
                # --- ADD-ON LOGIC: SCAN ALL ITEMS ---
                if subscription_id:
                    try:
                         active_addons = []
                         # List all items in this subscription
                         items = stripe.SubscriptionItem.list(subscription=subscription_id, limit=20)
                         for item in items.data:
                             item_addon_key = item.metadata.get('addon_key')
                             if not item_addon_key:
                                 prod = stripe.Product.retrieve(item.price.product)
                                 item_addon_key = prod.metadata.get('addon_key')
                             
                             if item_addon_key:
                                 active_addons.append(item_addon_key)
                         
                         if active_addons:
                             update_data['addons'] = list(set(active_addons))
                             print(f"WEBHOOK CHECKOUT: Found and syncing addons: {active_addons}", flush=True)
                    except Exception as e:
                         print(f"WEBHOOK CHECKOUT ERROR: Failed to scan subscription items: {e}", flush=True)
                # ------------------------------------

                response = supabase.table('profiles').upsert(update_data).execute()
                print(f"WEBHOOK UPDATE SUCCESS: {response}", flush=True)
            except Exception as e:
                error_msg = str(e)
                if "<html" in error_msg.lower():
                    print("WEBHOOK ERROR: Supabase Sync failed (HTML/Cloudflare response).", flush=True)
                else:
                    print(f"WEBHOOK ERROR: Supabase Sync failed: {error_msg}", flush=True)
        else:
            print("WEBHOOK ERROR: User ID or Plan Tier ID missing in metadata.", flush=True)

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
             
             # --- PROTECT SUPER_ADMIN ---
             try:
                 profile_res = supabase.table('profiles').select('subscription_tier').eq('id', user_id).single().execute()
                 if profile_res.data and profile_res.data.get('subscription_tier') == 'super_admin':
                     print(f"WEBHOOK: User {user_id} is 'super_admin'. Skipping status sync.", flush=True)
                     return {"status": "success", "message": "super_admin protected"}
             except:
                 pass
             # ---------------------------

             update_data = {
                'id': user_id,
                'status': new_status,
                'updated_at': 'now()'
             }

             # Sync Tier if not super_admin
             try:
                 profile_res = supabase.table('profiles').select('subscription_tier').eq('id', user_id).single().execute()
                 if profile_res.data and profile_res.data.get('subscription_tier') != 'super_admin':
                     # Fetch tier from sub metadata
                     plan_tier_id = sub.get('metadata', {}).get('plan_tier_id')
                     if not plan_tier_id:
                         # Fallback to product
                         product_id = sub.get('plan', {}).get('product')
                         if product_id:
                             prod = stripe.Product.retrieve(product_id)
                             plan_tier_id = prod.metadata.get('plan_tier_id')
                     
                     if plan_tier_id:
                         update_data['subscription_tier'] = plan_tier_id
                         update_data['last_plan_change_at'] = 'now()' # Update cooldown on tier change
             except Exception as e:
                 print(f"WEBHOOK ERROR: Failed to resolve tier on update: {e}", flush=True)

             # --- ADD-ON LOGIC: SCAN ALL ITEMS ---
             # We scan ALL items in the subscription to find any add-ons
             try:
                 active_addons = []
                 main_tier = None
                 
                 # List all items in this subscription
                 items = stripe.SubscriptionItem.list(subscription=sub.id, limit=20)
                 for item in items.data:
                     # Check item metadata first, then product metadata
                     item_addon_key = item.metadata.get('addon_key')
                     item_tier_id = item.metadata.get('plan_tier_id')
                     
                     if not item_addon_key or not item_tier_id:
                         prod = stripe.Product.retrieve(item.price.product)
                         if not item_addon_key: item_addon_key = prod.metadata.get('addon_key')
                         if not item_tier_id: item_tier_id = prod.metadata.get('plan_tier_id')
                     
                     if item_addon_key:
                         active_addons.append(item_addon_key)
                     elif item_tier_id:
                         # This is the main plan
                         main_tier = item_tier_id
                 
                 print(f"WEBHOOK SYNC: Found Addons: {active_addons}, Main Tier: {main_tier}", flush=True)
                 
                 if new_status in ['active', 'trialing']:
                     update_data['addons'] = list(set(active_addons))
                     if main_tier and current_tier != 'super_admin':
                         update_data['subscription_tier'] = main_tier
                 else:
                     # If sub is canceled/past_due, remove these specific addons?
                     # Actually, if the WHOLE sub is canceled, we clear them.
                     update_data['addons'] = []
                     if current_tier != 'super_admin':
                          update_data['subscription_tier'] = None

             except Exception as e:
                 print(f"WEBHOOK ERROR: Failed to scan subscription items: {e}", flush=True)
             # ------------------------------------

             supabase.table('profiles').upsert(update_data).execute()
             print(f"WEBHOOK: Profile {user_id} updated via sync (Cancel={sub.get('cancel_at_period_end')}).", flush=True)

    elif event['type'] == 'customer.subscription.deleted':
        sub = event['data']['object']
        print(f"WEBHOOK: Subscription {sub.get('id')} deleted.", flush=True)
        
        user_id = sub.get('metadata', {}).get('user_id')
        if user_id:
            # --- PROTECT SUPER_ADMIN ---
            current_tier = None
            try:
                profile_res = supabase.table('profiles').select('subscription_tier').eq('id', user_id).single().execute()
                if profile_res.data:
                    current_tier = profile_res.data.get('subscription_tier')
            except:
                pass
            
            if current_tier == 'super_admin':
                print(f"WEBHOOK: User {user_id} is 'super_admin'. Skipping deletion update.", flush=True)
                return {"status": "success", "message": "Super Admin - Access preserved"}
            # ---------------------------

            update_data = {
                'id': user_id,
                'status': 'canceled',
                'updated_at': 'now()'
            }
            # Only reset tier if NOT super_admin
            if current_tier != 'super_admin':
                 update_data['subscription_tier'] = None
            
            supabase.table('profiles').upsert(update_data).execute()
            print(f"WEBHOOK: Profile {user_id} cancelled.", flush=True)
    
    else:
        print(f"WEBHOOK: Ignored event type {event['type']}", flush=True)

    return {"status": "success"}

@router.post("/sync-subscription")
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
        status = 'none'
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
                 print(f"Warning: SYNC AUTH LOOKUP FAILED: {auth_err}", flush=True)

        if not current_user_id and target_sub:
             # Fallback to metadata ONLY if we couldn't find user by email/frontend
             current_user_id = target_sub.metadata.get('user_id')

        if current_user_id:
             user_id = current_user_id # Use the resolved ID
             from supabase import create_client
             url: str = os.getenv("SUPABASE_URL")
             key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
             supabase_admin = create_client(url, key)
             
             # Check if current tier is super_admin to avoid overwriting it
             current_tier = None
             try:
                 profile_res = supabase_admin.table('profiles').select('subscription_tier').eq('id', user_id).single().execute()
                 if profile_res.data:
                     current_tier = profile_res.data.get('subscription_tier')
             except:
                 pass

             update_data = {
                 'id': user_id,
                 'status': 'active' if current_tier == 'super_admin' else status,
                 'updated_at': 'now()',
             }
             
             # If NOT super_admin, we handle tier updates
             if current_tier != 'super_admin' and target_sub:
                  # --- ADD-ON LOGIC: SCAN ALL ITEMS ---
                  try:
                      active_addons = []
                      main_tier = None
                      
                      # List all items in this subscription
                      items = stripe.SubscriptionItem.list(subscription=target_sub.id, limit=20)
                      for item in items.data:
                          # Check item metadata first, then product metadata
                          item_addon_key = item.metadata.get('addon_key')
                          item_tier_id = item.metadata.get('plan_tier_id')
                          
                          if not item_addon_key or not item_tier_id:
                              prod = stripe.Product.retrieve(item.price.product)
                              if not item_addon_key: item_addon_key = prod.metadata.get('addon_key')
                              if not item_tier_id: item_tier_id = prod.metadata.get('plan_tier_id')
                          
                          if item_addon_key:
                              active_addons.append(item_addon_key)
                          elif item_tier_id:
                              # This is the main plan
                              main_tier = item_tier_id
                      
                      print(f"SYNC SCAN: Found Addons: {active_addons}, Main Tier: {main_tier}", flush=True)
                      
                      if status in ['active', 'trialing']:
                          update_data['addons'] = list(set(active_addons))
                          if main_tier:
                              update_data['subscription_tier'] = main_tier
                      else:
                          # If sub is not active, clear addons
                          update_data['addons'] = []
                          update_data['subscription_tier'] = None

                  except Exception as e:
                      print(f"SYNC ERROR: Failed to scan subscription items: {e}", flush=True)
                  # ------------------------------------
             elif status == 'none' and current_tier != 'super_admin':
                 update_data['subscription_tier'] = None
                 update_data['addons'] = []
             else:
                 print(f"SYNC: User {user_id} is 'super_admin' or no sub found. Skipping tier overwrite.", flush=True)

             if trial_end:
                 update_data['trial_end'] = trial_end
                 
             supabase_admin.table('profiles').upsert(update_data).execute()
             print(f"SYNC: Force updated profile {user_id} to {status}", flush=True)
             return {"status": "success", "profile_status": status}
        
        return {"status": "skipped", "message": "No linked user_id found"}

    except Exception as e:
        print(f"Sync Error: {e}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))
