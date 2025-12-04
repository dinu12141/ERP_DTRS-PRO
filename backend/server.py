from fastapi import FastAPI, APIRouter, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from firebase_admin import credentials, firestore, auth, initialize_app
import firebase_admin
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv

# Setup paths and env
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# --- FIREBASE SETUP ---
# Make sure you have 'serviceAccountKey.json' in your backend folder
cred_path = ROOT_DIR / "serviceAccountKey.json"

if not firebase_admin._apps:
    if cred_path.exists():
        cred = credentials.Certificate(str(cred_path))
        initialize_app(cred)
        print("✅ Firebase initialized successfully.")
    else:
        print("⚠️ Warning: serviceAccountKey.json not found. Database calls will fail.")

# Initialize Firestore
try:
    db = firestore.client()
except Exception as e:
    db = None
    print(f"❌ Firestore connection failed: {e}")

# --- APP SETUP ---
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS ---
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# User models for Admin Creation
class UserSchema(BaseModel):
    email: str
    role: str
    firstName: str
    lastName: str

class RegisterRequest(BaseModel):
    user: UserSchema
    password: str

# --- API ROUTES ---
api_router = APIRouter(prefix="/api")

@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(client_name=input.client_name)
    
    # Prepare data for Firestore
    doc_data = status_obj.model_dump()
    doc_data['timestamp'] = doc_data['timestamp'].isoformat()
    
    if db:
        # Save to 'status_checks' collection
        db.collection("status_checks").add(doc_data)
    
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    if not db:
        return []
    
    # Fetch from Firestore
    docs = db.collection("status_checks").limit(100).stream()
    results = []
    for doc in docs:
        data = doc.to_dict()
        # Convert timestamp string back to datetime
        if isinstance(data.get('timestamp'), str):
            data['timestamp'] = datetime.fromisoformat(data['timestamp'])
        results.append(StatusCheck(**data))
    return results

# --- AUTH ROUTES (For Admin Script) ---
auth_router = APIRouter(prefix="/auth")

@auth_router.post("/register")
async def register_user(request: RegisterRequest):
    try:
        # 1. Create user in Firebase Authentication
        user_record = auth.create_user(
            email=request.user.email,
            password=request.password,
            display_name=f"{request.user.firstName} {request.user.lastName}"
        )

        # 2. Save user details to Firestore 'users' collection
        user_data = request.user.model_dump()
        user_data["uid"] = user_record.uid
        user_data["createdAt"] = datetime.now(timezone.utc).isoformat()
        
        if db:
            db.collection("users").document(user_record.uid).set(user_data)

        return {"message": "User created successfully", "uid": user_record.uid}

    except Exception as e:
        print(f"Error creating user: {e}")
        # Return 400 error so the script knows it failed
        raise HTTPException(status_code=400, detail=str(e))

@auth_router.post("/login")
async def login_check(username: str = Form(...), password: str = Form(...)):
    """
    Used by create_admin_simple.py to check if user exists.
    """
    try:
        # Check if user exists by email
        user = auth.get_user_by_email(username)
        return {"message": "User exists", "uid": user.uid}
    except:
        # If not found, return 404 so script proceeds to create
        raise HTTPException(status_code=404, detail="User not found")

# Register Routers
app.include_router(api_router)
app.include_router(auth_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)