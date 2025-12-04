"""
Script to create an admin user.
Run this script to create a default admin account.

Usage:
    python create_admin.py
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.main import db
from app.routers.auth import get_password_hash
from app.models.schemas import User, UserRole
from datetime import datetime

def create_admin_user():
    """Create a default admin user."""
    email = "admin@dtrspro.com"
    password = "admin123"
    
    # Check if admin already exists
    users_ref = db.collection("users")
    query = users_ref.where("email", "==", email)
    existing = list(query.stream())
    
    if existing:
        print(f"❌ Admin user with email '{email}' already exists!")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        return
    
    # Create admin user
    admin_user = {
        "email": email,
        "passwordHash": get_password_hash(password),
        "role": UserRole.ADMIN.value,
        "firstName": "Admin",
        "lastName": "User",
        "isActive": True,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    _, user_ref = db.collection("users").add(admin_user)
    
    print("✅ Admin user created successfully!")
    print(f"\n📧 Login Credentials:")
    print(f"   Email: {email}")
    print(f"   Password: {password}")
    print(f"\n⚠️  Please change the password after first login!")

if __name__ == "__main__":
    try:
        create_admin_user()
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        import traceback
        traceback.print_exc()


