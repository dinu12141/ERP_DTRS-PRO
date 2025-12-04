from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# Initialize Firebase
cred_path = os.environ.get('FIREBASE_CREDENTIALS_PATH')

# Fallback to serviceAccountKey.json in root or backend root if env var not set
if not cred_path:
    possible_paths = [
        ROOT_DIR / "serviceAccountKey.json",
        ROOT_DIR / "backend" / "serviceAccountKey.json",
        Path("serviceAccountKey.json")
    ]
    for p in possible_paths:
        if p.exists():
            cred_path = str(p)
            break

if not firebase_admin._apps:
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print(f"✅ Firebase initialized with credentials from: {cred_path}")
    else:
        # Warning: Firebase not initialized. 
        # In production, this should probably raise an error.
        # For dev, we might want to mock or warn.
        print("WARNING: FIREBASE_CREDENTIALS_PATH not found or invalid. Database calls will fail.")
else:
    print("✅ Firebase already initialized.")

# Initialize Firestore
db = firestore.client()

app = FastAPI(title="DTRS PRO ERP Backend")

# CORS
origins = os.environ.get('CORS_ORIGINS', '*').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import (
    auth,
    partners,
    contacts,
    leads,
    jobs,
    dispatch,
    crews,
    vehicles,
    inventory,
    skus,
    estimates,
    invoices,
    portals,
    stripe_payments,
    reporting,
    automation,
    weather,
    tech,
)

app.include_router(auth.router)
app.include_router(partners.router)
app.include_router(contacts.router)
app.include_router(leads.router)
app.include_router(jobs.router)
app.include_router(dispatch.router)
app.include_router(crews.router)
app.include_router(vehicles.router)
app.include_router(inventory.router)
app.include_router(skus.router)
app.include_router(estimates.router)
app.include_router(invoices.router)
app.include_router(portals.router)
app.include_router(stripe_payments.router)
app.include_router(reporting.router)
app.include_router(automation.router)
app.include_router(weather.router)
app.include_router(tech.router)

@app.get("/")
async def root():
    return {"message": "DTRS PRO ERP Backend Online"}
