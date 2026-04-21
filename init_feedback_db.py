import sys
import os
from dotenv import load_dotenv

load_dotenv()

from supabase import create_client, Client

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
    sys.exit(1)

supabase: Client = create_client(url, key)

print("Attempting to insert a bootstrap row into 'app_feedback' to initialize the table...")
try:
    res = supabase.table("app_feedback").insert({
        "type": "initialization",
        "message": "Feedback table created."
    }).execute()
    print("Success! Table app_feedback exists and is ready.")
except Exception as e:
    print("Error interacting with app_feedback:")
    print(e)
    print("\n\n--- ACTION REQUIRED ---")
    print("Please go to your Supabase SQL Editor and run:")
    print("CREATE TABLE app_feedback (")
    print("  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),")
    print("  user_id UUID,")
    print("  type TEXT NOT NULL,")
    print("  message TEXT NOT NULL,")
    print("  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL")
    print(");")
