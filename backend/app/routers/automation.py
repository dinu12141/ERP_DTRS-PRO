from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.routers.auth import get_current_active_user, User
from app.main import db
from google.cloud.firestore_v1.base_query import FieldFilter

router = APIRouter(prefix="/automation", tags=["automation"])


class AutomationRule(BaseModel):
    id: Optional[str] = None
    name: str
    trigger: str  # e.g., "job_status_change", "inventory_low"
    condition: Optional[str] = None  # Optional condition expression
    action: str  # e.g., "create_invoice", "send_email"
    actionParams: Optional[dict] = {}
    enabled: bool = True
    createdAt: datetime = None
    updatedAt: datetime = None


@router.get("/", response_model=List[AutomationRule])
async def list_automations(
    enabled: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user)
):
    """List all automation rules."""
    automations_ref = db.collection("automations")
    query = automations_ref
    
    if enabled is not None:
        query = query.where(filter=FieldFilter("enabled", "==", enabled))
    
    automations = []
    for doc in query.stream():
        data = doc.to_dict()
        data["id"] = doc.id
        automations.append(AutomationRule(**data))
    
    return automations


@router.post("/", response_model=AutomationRule)
async def create_automation(
    automation: AutomationRule,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new automation rule."""
    automation_dict = automation.model_dump(exclude={"id"})
    automation_dict["createdAt"] = datetime.utcnow()
    automation_dict["updatedAt"] = datetime.utcnow()
    
    _, ref = db.collection("automations").add(automation_dict)
    automation.id = ref.id
    return automation


@router.put("/{automation_id}", response_model=AutomationRule)
async def update_automation(
    automation_id: str,
    automation: AutomationRule,
    current_user: User = Depends(get_current_active_user)
):
    """Update an automation rule."""
    doc_ref = db.collection("automations").document(automation_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    automation_dict = automation.model_dump(exclude={"id"})
    automation_dict["updatedAt"] = datetime.utcnow()
    
    doc_ref.update(automation_dict)
    automation.id = automation_id
    return automation


@router.delete("/{automation_id}")
async def delete_automation(
    automation_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete an automation rule."""
    doc_ref = db.collection("automations").document(automation_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    doc_ref.delete()
    return {"message": "Automation deleted successfully"}


@router.post("/{automation_id}/toggle")
async def toggle_automation(
    automation_id: str,
    enabled: bool,
    current_user: User = Depends(get_current_active_user)
):
    """Enable or disable an automation rule."""
    doc_ref = db.collection("automations").document(automation_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    doc_ref.update({"enabled": enabled, "updatedAt": datetime.utcnow()})
    return {"message": f"Automation {'enabled' if enabled else 'disabled'}"}


@router.get("/logs")
async def get_automation_logs(
    automation_id: Optional[str] = None,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user)
):
    """Get automation execution logs."""
    logs_ref = db.collection("automation_logs")
    query = logs_ref.order_by("executedAt", direction="DESCENDING").limit(limit)
    
    if automation_id:
        query = query.where(filter=FieldFilter("automationId", "==", automation_id))
    
    logs = []
    for doc in query.stream():
        data = doc.to_dict()
        data["id"] = doc.id
        logs.append(data)
    
    return logs

