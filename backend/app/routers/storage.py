from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from firebase_admin import storage as firebase_storage
from app.routers.auth import get_current_active_user, User
from typing import Optional
import os
from datetime import datetime, timedelta

router = APIRouter(prefix="/storage", tags=["storage"])

# Initialize Firebase Storage bucket
try:
    bucket = firebase_storage.bucket()
except Exception:
    bucket = None


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    folder: str = "uploads",
    current_user: User = Depends(get_current_active_user)
):
    """Upload a file to Firebase Storage."""
    if not bucket:
        raise HTTPException(status_code=500, detail="Storage bucket not configured")
    
    try:
        # Generate unique filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        file_extension = os.path.splitext(file.filename)[1]
        filename = f"{folder}/{timestamp}_{file.filename}"
        
        # Upload file
        blob = bucket.blob(filename)
        blob.upload_from_file(file.file, content_type=file.content_type)
        
        # Make file publicly accessible (or use signed URLs for private files)
        blob.make_public()
        
        # Get public URL
        url = blob.public_url
        
        return {
            "url": url,
            "filename": filename,
            "size": blob.size,
            "contentType": file.content_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/download-url")
async def get_download_url(
    filename: str,
    expires_in: int = 3600,  # 1 hour default
    current_user: User = Depends(get_current_active_user)
):
    """Get a signed download URL for a file."""
    if not bucket:
        raise HTTPException(status_code=500, detail="Storage bucket not configured")
    
    try:
        blob = bucket.blob(filename)
        url = blob.generate_signed_url(
            expiration=datetime.utcnow() + timedelta(seconds=expires_in),
            method='GET'
        )
        return {"url": url, "expiresIn": expires_in}
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"File not found: {str(e)}")


@router.delete("/delete")
async def delete_file(
    filename: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a file from Firebase Storage."""
    if not bucket:
        raise HTTPException(status_code=500, detail="Storage bucket not configured")
    
    try:
        blob = bucket.blob(filename)
        blob.delete()
        return {"message": "File deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"File not found: {str(e)}")

