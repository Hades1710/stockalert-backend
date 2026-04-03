from app.database import supabase
import sys

def login():
    print("--- Supabase JWT Token Generator ---")
    email = input("Enter Supabase test user email: ")
    password = input("Enter password: ")
    
    try:
        response = supabase.auth.sign_in_with_password({"email": email, "password": password})
        print("\n✅ Login Successful!\n")
        print("=== YOUR ACCESS TOKEN (Copy everything below this line) ===")
        print(response.session.access_token)
        print("=========================================================\n")
        print("Next Step:\n1. Go to Swagger UI (http://127.0.0.1:8000/docs)")
        print("2. Click the green 'Authorize' button at the top right.")
        print("3. Paste this token into the 'Value' box and click Authorize.")
    except Exception as e:
        print(f"\n❌ Login failed: {e}")
        print("Make sure you have created a user in your Supabase Auth dashboard!")

if __name__ == "__main__":
    login()
