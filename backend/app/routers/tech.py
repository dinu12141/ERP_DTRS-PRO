from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models.schemas import TechJSA, TechDamageScan, TechDetach, TechReset
from app.main import db
from app.routers.auth import get_current_active_user, User
from google.cloud.firestore_v1.base_query import FieldFilter

router = APIRouter(prefix="/tech", tags=["tech"])

@router.post("/jsa", response_model=TechJSA)
async def create_jsa(jsa: TechJSA, current_user: User = Depends(get_current_active_user)):
    """
    Submit a Job Safety Analysis (JSA) form.
    """
    # Ensure the technicianId matches the current user (or allow admin to submit for others?)
    # For now, we'll override it with the current user's ID to be safe, unless they are admin.
    if current_user.role != "admin":
        jsa.technicianId = current_user.id
        
    jsa_dict = jsa.model_dump(exclude={"id"})
    
    update_time, doc_ref = db.collection("tech_jsa").add(jsa_dict)
    jsa.id = doc_ref.id
    return jsa

@router.get("/jsa", response_model=List[TechJSA])
async def get_jsas(job_id: str = None, current_user: User = Depends(get_current_active_user)):
    """
    Get JSAs, optionally filtered by job ID.
    """
    jsa_ref = db.collection("tech_jsa")
    
    if job_id:
        query = jsa_ref.where(filter=FieldFilter("jobId", "==", job_id))
    else:
        # If not admin/manager, maybe only show own JSAs?
        # For now, let's just return all for simplicity, or filter by user if needed.
        if current_user.role in ["admin", "manager"]:
            query = jsa_ref
        else:
            query = jsa_ref.where(filter=FieldFilter("technicianId", "==", current_user.id))
            
    docs = query.stream()
    jsas = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        jsas.append(TechJSA(**data))
        
    return jsas

@router.post("/damage-scan", response_model=TechDamageScan)
async def create_damage_scan(scan: TechDamageScan, current_user: User = Depends(get_current_active_user)):
    """
    Submit a Damage Scan form.
    """
    if current_user.role != "admin":
        scan.technicianId = current_user.id
        
    scan_dict = scan.model_dump(exclude={"id"})
    
    update_time, doc_ref = db.collection("damage_scans").add(scan_dict)
    scan.id = doc_ref.id
    return scan

@router.post("/detach", response_model=TechDetach)
async def create_detach(detach: TechDetach, current_user: User = Depends(get_current_active_user)):
    """
    Submit a Detach Workflow form.
    """
    if current_user.role != "admin":
        detach.technicianId = current_user.id
        
    detach_dict = detach.model_dump(exclude={"id"})
    
    update_time, doc_ref = db.collection("detach_workflows").add(detach_dict)
    detach.id = doc_ref.id
    return detach

@router.post("/reset", response_model=TechReset)
async def create_reset(reset: TechReset, current_user: User = Depends(get_current_active_user)):
    """
    Submit a Reset Workflow form.
    """
    if current_user.role != "admin":
        reset.technicianId = current_user.id
        
    reset_dict = reset.model_dump(exclude={"id"})
    
    update_time, doc_ref = db.collection("reset_workflows").add(reset_dict)
    reset.id = doc_ref.id
    return reset
