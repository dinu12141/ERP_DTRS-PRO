from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth as firebase_auth
from datetime import datetime
from typing import Optional
from app.models.schemas import (
    User,
    UserRole,
    RegisterRequest,
    TokenResponse,
)
from pydantic import BaseModel
from app.main import db
from google.cloud.firestore_v1.base_query import FieldFilter

router = APIRouter(prefix="/auth", tags=["auth"])

security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Verify Firebase ID token and return user."""
    try:
        # Verify the Firebase ID token
        decoded_token = firebase_auth.verify_id_token(credentials.credentials)
        uid = decoded_token.get('uid')
        
        if not uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Get user from Firestore
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user_data = user_doc.to_dict()
        user_data["id"] = user_doc.id
        return User(**user_data)
        
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.isActive:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def require_role(allowed_roles: list[UserRole]):
    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker


@router.post("/register", response_model=User)
async def register(request: RegisterRequest):
    """Register a new user using Firebase Auth."""
    user = request.user
    password = request.password
    
    # Check if user already exists in Firestore
    users_ref = db.collection("users")
    query = users_ref.where(filter=FieldFilter("email", "==", user.email))
    existing = list(query.stream())
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    try:
        # Create user in Firebase Authentication
        firebase_user = firebase_auth.create_user(
            email=user.email,
            password=password,
            display_name=f"{user.firstName or ''} {user.lastName or ''}".strip()
        )
        
        # Save user details to Firestore
        user_dict = user.model_dump(exclude={"id"})
        user_dict["id"] = firebase_user.uid
        user_dict["createdAt"] = datetime.utcnow()
        user_dict["updatedAt"] = datetime.utcnow()
        
        db.collection("users").document(firebase_user.uid).set(user_dict)
        
        user.id = firebase_user.uid
        return user
        
    except firebase_auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=400, detail="Email already registered")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create user: {str(e)}")


@router.post("/verify-token")
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify Firebase ID token and return user info."""
    try:
        decoded_token = firebase_auth.verify_id_token(credentials.credentials)
        uid = decoded_token.get('uid')
        
        # Get user from Firestore
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_doc.to_dict()
        user_data["id"] = user_doc.id
        
        return {
            "user": User(**user_data),
            "uid": uid,
            "email": decoded_token.get('email')
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}"
        )


@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current authenticated user."""
    return current_user

