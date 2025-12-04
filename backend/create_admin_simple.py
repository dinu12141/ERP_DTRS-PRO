"""
Simple script to create an admin user via API call.
Make sure the backend server is running first.

Usage:
    python create_admin_simple.py
"""
import requests
import json

API_URL = "http://localhost:8000"

def create_admin():
    """Create admin user via API."""
    admin_data = {
        "email": "admin@dtrspro.com",
        "password": "admin123",
        "role": "admin",
        "firstName": "Admin",
        "lastName": "User"
    }
    
    try:
        # Check if user exists by trying to verify token (if logged in)
        # For now, just try to create - Firebase will handle duplicates
        pass
        
        # Create user - register endpoint expects user object and password
        user_obj = {
            "email": admin_data["email"],
            "role": admin_data["role"],
            "firstName": admin_data["firstName"],
            "lastName": admin_data["lastName"]
        }
        
        response = requests.post(
            f"{API_URL}/auth/register",
            json={"user": user_obj, "password": admin_data["password"]}
        )
        
        if response.status_code == 200:
            print("✅ Admin user created successfully!")
            print(f"\n📧 Login Credentials:")
            print(f"   Email: {admin_data['email']}")
            print(f"   Password: {admin_data['password']}")
            print(f"\n⚠️  Please change the password after first login!")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to backend server.")
        print("   Make sure the backend is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    create_admin()

