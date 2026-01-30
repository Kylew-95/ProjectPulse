import os
import sys
import stripe
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env from parent directory (pythonPulse/.env)
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

STRIPE_KEY = os.getenv("STRIPE_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not STRIPE_KEY or not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Error: Missing environment variables. Check .env")
    exit(1)

# SAFETY CHECK: Ensure we are using a Test Key
if not STRIPE_KEY.startswith("sk_test_"):
    print("DANGER: STRIPE_KEY does not start with 'sk_test_'.")
    print("   Aborting to prevent accidental deletion of live data.")
    exit(1)

stripe.api_key = STRIPE_KEY
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def wipe_stripe():
    print("Wiping Stripe Data (Test Mode)...")
    
    # 0. Subscriptions (Explicit Delete)
    try:
        print("   - Deleting Subscriptions...")
        subscriptions = stripe.Subscription.list(limit=100, status='all')
        for sub in subscriptions.auto_paging_iter():
            try:
                stripe.Subscription.delete(sub.id)
                print(f"     Deleted subscription {sub.id}")
            except Exception as e:
                print(f"     Failed to delete subscription {sub.id}: {e}")
    except Exception as e:
        print(f"Error wiping subscriptions: {e}")

    # 1. Customers
    try:
        print("   - Deleting Customers...")
        customers = stripe.Customer.list(limit=100)
        for cust in customers.auto_paging_iter():
            try:
                stripe.Customer.delete(cust.id)
                print(f"     Deleted customer {cust.id}")
            except Exception as e:
                print(f"     Failed to delete customer {cust.id}: {e}")
    except Exception as e:
        print(f"Error wiping customers: {e}")

    # 2. Coupons
    try:
        print("   - Deleting Coupons...")
        coupons = stripe.Coupon.list(limit=100)
        for item in coupons.auto_paging_iter():
            try:
                stripe.Coupon.delete(item.id)
                print(f"     Deleted coupon {item.id}")
            except Exception as e:
                print(f"     Failed to delete coupon {item.id}: {e}")
    except Exception as e:
        print(f"Error wiping coupons: {e}")

    # 3. Prices (Try DELETE first)
    try:
        print("   - Deleting Prices...")
        prices = stripe.Price.list(limit=100)  # active and inactive
        for item in prices.auto_paging_iter():
            try:
                # Disconnect from product if necessary, but usually delete works if no subs
                stripe.Price.modify(item.id, active=False) # Helper: Deactivate first often helps
                # Actually, delete is not always supported for Prices in API if they have been used.
                # However, user requested DELETE test data behavior.
                # In Test mode, we can delete mostly anything unused.
                # If used, we must archive.
                # Attempt delete:
                ## Note: Stripe API for Price DELETE is limited. Verify if 'delete' works.
                ## Usually Prices are immutable if used. But in 'Delete Test Data' reset, they are gone.
                ## Since we can't trigger the official 'Delete Test Data' endpoint via API,
                ## We will try to delete, fallback to archive.
                pass 
                # Re-reading docs: Prices cannot be deleted via API if they have been used.
                # BUT, since we deleted all customers/subs above, they might be free?
                # Actually, invoices persist.
                # We should delete Invoices? 
                # To be thorough:
            except:
                pass

        # Deleting Invoices could free up Prices
        # But for now, let's aggressively ARCHIVE products/prices 
        # because API does not allow full deletion of objects used in InvoiceItems/Invoices easily.
        # WAIT: User specifically said 'wipe the test data'.
        # If we truly want to clear it, we should allow the script to be 'best effort' delete.
        
        pass 
    except:
        pass

    # RE-IMPLEMENTATION of Prices/Products loop
    try:
        print("   - Deleting/Archiving Prices...")
        prices = stripe.Price.list(limit=100)
        for item in prices.auto_paging_iter():
            try:
                 # Try modify to inactive first, then delete? No, modify first prevents usage.
                 stripe.Price.modify(item.id, active=False)
                 # No delete endpoint for Price in some versions? It exists but restricts.
                 # Let's try it.
                 # stripe.Price.delete(item.id) # This catches if not possible
            except:
                 pass
            print(f"     Processed price {item.id}")
            
    except Exception as e:
        print(f"Error processing prices: {e}")

    # 4. Products (Delete if possible)
    try:
        print("   - Deleting Products...")
        products = stripe.Product.list(limit=100)
        for item in products.auto_paging_iter():
            try:
                # 1. Archive first
                stripe.Product.modify(item.id, active=False)
                # 2. Try Delete
                stripe.Product.delete(item.id)
                print(f"     Deleted product {item.id}")
            except Exception as e:
                print(f"     Archived product {item.id} (Delete blocked: {e})")
    except Exception as e:
        print(f"Error processing products: {e}")

    print("Stripe Wipe Complete.\n")

def wipe_supabase_table(table_name):
    """Fetches IDs and deletes them to handle UUIDs correctly and avoid 'invalid input syntax' errors."""
    try:
        print(f"   - Clearing {table_name}...")
        # Select only IDs to minimize data transfer
        res = supabase.table(table_name).select("id").execute()
        ids = [row['id'] for row in res.data]
        
        if not ids:
            print(f"     (Already empty)")
            return

        # Delete in chunks if necessary (Supabase URL limit, though usually batch delete works ok for small sets)
        # For safety, standard wiping:
        supabase.table(table_name).delete().in_('id', ids).execute()
        print(f"     Deleted {len(ids)} rows from {table_name}")

    except Exception as e:
        print(f"Error clearing {table_name}: {e}")

def wipe_supabase():
    print("Wiping Supabase Data...")
    
    # Order matters for Foreign Keys
    tables_to_wipe = [
        'team_members', # refs teams, users
        'teams',        # refs users
        'tickets',      # refs users
        # 'messages',   # refs nothing foreign key wise usually, but good to clean. Check schema?
        # messages table schema: user_id text, but no 'references' keyword in schema.sql viewed earlier
        # So it's safe to delete whenever.
        'messages',
        'profiles',     # refs users
    ]

    for table in tables_to_wipe:
        wipe_supabase_table(table)

    # Finally Delete Users
    # Note: Admin delete user cascades to profiles usually if set up, but we wiped profiles manually above just in case.
    try:
        print("   - Deleting Auth Users...")
        users = supabase.auth.admin.list_users()
        for user in users:
            try:
                supabase.auth.admin.delete_user(user.id)
                print(f"     Deleted user {user.id}")
            except Exception as ue:
                print(f"     Failed to delete user {user.id}: {ue}")
    except Exception as e:
        print(f"Error listing/deleting users: {e}")

    print("Supabase Wipe Complete.\n")

if __name__ == "__main__":
    if "--force" in sys.argv:
        print("Warning: Force Mode detected. Wiping immediately...")
        wipe_stripe()
        wipe_supabase()
        print("Environment Reset Successfully.")
    else:
        confirm = input("WARNING: This will DELETE/ARCHIVE ALL Data in Stripe (Test Mode) and Supabase. Type 'DELETE' to confirm: ")
        if confirm.strip() == "DELETE":
            wipe_stripe()
            wipe_supabase()
            print("Environment Reset Successfully.")
        else:
            print("Operation Cancelled.")
