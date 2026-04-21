import asyncio
import os
import sys

# Setup paths to import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import supabase

def verify_count():
    res = supabase.table("profiles").select("*", count="exact").eq("telegram_enabled", True).execute()
    print("Total users with telegram connected:", res.count)
    if res.data:
        print("First user with telegram:", res.data[0])

    # Now let's grant PRO to up to 50 users who have telegram connected
    # We order by some field, ideally created_at or id, but let's just get them and update
    to_upgrade = supabase.table("profiles").select("*").eq("telegram_enabled", True).limit(50).execute()
    
    for profile in to_upgrade.data:
        if profile.get("tier") != "pro":
            print(f"Upgrading user {profile['id']} to PRO")
            supabase.table("profiles").update({"tier": "pro"}).eq("id", profile["id"]).execute()
        else:
            print(f"User {profile['id']} is already PRO")

if __name__ == "__main__":
    verify_count()
