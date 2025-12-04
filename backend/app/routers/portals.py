from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
from app.models.schemas import (
    Job,
    Invoice,
    PortalDocument,
    PaymentIntent,
    Notification,
    UserRole,
    JobWorkflowState,
)
from app.routers.auth import get_current_active_user, require_role, User
from app.main import db
from google.cloud.firestore_v1.base_query import FieldFilter

router = APIRouter(prefix="/portals", tags=["portals"])


# ---------- Homeowner Portal Endpoints ----------

@router.get("/homeowner/jobs", response_model=List[Job])
async def get_homeowner_jobs(current_user: User = Depends(require_role([UserRole.HOMEOWNER]))):
    """Get all jobs for the authenticated homeowner."""
    if not current_user.customerId:
        raise HTTPException(status_code=400, detail="Customer ID not found for user")
    
    jobs_ref = db.collection("jobs")
    query = jobs_ref.where(filter=FieldFilter("customerId", "==", current_user.customerId))
    docs = query.stream()
    
    jobs = []
    for doc in docs:
        job_data = doc.to_dict()
        job_data["id"] = doc.id
        jobs.append(Job(**job_data))
    
    return jobs


@router.get("/homeowner/jobs/{job_id}", response_model=Job)
async def get_homeowner_job(
    job_id: str,
    current_user: User = Depends(require_role([UserRole.HOMEOWNER]))
):
    """Get a specific job for the authenticated homeowner."""
    if not current_user.customerId:
        raise HTTPException(status_code=400, detail="Customer ID not found for user")
    
    job_ref = db.collection("jobs").document(job_id)
    job_doc = job_ref.get()
    
    if not job_doc.exists:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job_data = job_doc.to_dict()
    if job_data.get("customerId") != current_user.customerId:
        raise HTTPException(status_code=403, detail="Access denied")
    
    job_data["id"] = job_doc.id
    return Job(**job_data)


@router.get("/homeowner/documents", response_model=List[PortalDocument])
async def get_homeowner_documents(
    job_id: str = None,
    current_user: User = Depends(require_role([UserRole.HOMEOWNER]))
):
    """Get documents for the authenticated homeowner."""
    if not current_user.customerId:
        raise HTTPException(status_code=400, detail="Customer ID not found for user")
    
    docs_ref = db.collection("portal_documents")
    query = docs_ref.where(filter=FieldFilter("customerId", "==", current_user.customerId))
    
    if job_id:
        query = query.where(filter=FieldFilter("jobId", "==", job_id))
    
    docs = query.stream()
    
    documents = []
    for doc in docs:
        doc_data = doc.to_dict()
        doc_data["id"] = doc.id
        documents.append(PortalDocument(**doc_data))
    
    return documents


@router.get("/homeowner/invoices", response_model=List[Invoice])
async def get_homeowner_invoices(
    current_user: User = Depends(require_role([UserRole.HOMEOWNER]))
):
    """Get invoices for the authenticated homeowner."""
    if not current_user.customerId:
        raise HTTPException(status_code=400, detail="Customer ID not found for user")
    
    invoices_ref = db.collection("invoices")
    query = invoices_ref.where(filter=FieldFilter("customerId", "==", current_user.customerId))
    docs = query.stream()
    
    invoices = []
    for doc in docs:
        inv_data = doc.to_dict()
        inv_data["id"] = doc.id
        invoices.append(Invoice(**inv_data))
    
    return invoices


@router.post("/homeowner/payments/create-intent", response_model=PaymentIntent)
async def create_payment_intent(
    invoice_id: str,
    current_user: User = Depends(require_role([UserRole.HOMEOWNER]))
):
    """Create a Stripe payment intent for an invoice."""
    if not current_user.customerId:
        raise HTTPException(status_code=400, detail="Customer ID not found for user")
    
    # Get invoice
    invoice_ref = db.collection("invoices").document(invoice_id)
    invoice_doc = invoice_ref.get()
    
    if not invoice_doc.exists:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    invoice_data = invoice_doc.to_dict()
    if invoice_data.get("customerId") != current_user.customerId:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Create payment intent (Stripe integration will be added)
    payment_intent = PaymentIntent(
        invoiceId=invoice_id,
        customerId=current_user.customerId,
        amount=invoice_data.get("balanceDue", invoice_data.get("total", 0)),
        status="pending"
    )
    
    payment_dict = payment_intent.model_dump(exclude={"id"})
    _, payment_ref = db.collection("payment_intents").add(payment_dict)
    payment_intent.id = payment_ref.id
    
    return payment_intent


# ---------- Roofer Portal Endpoints ----------

@router.get("/roofer/dashboard")
async def get_roofer_dashboard(
    current_user: User = Depends(require_role([UserRole.PARTNER]))
):
    """Get dashboard data for the authenticated roofer."""
    if not current_user.partnerId:
        raise HTTPException(status_code=400, detail="Partner ID not found for user")
    
    # Get jobs for this partner
    jobs_ref = db.collection("jobs")
    query = jobs_ref.where(filter=FieldFilter("partnerId", "==", current_user.partnerId))
    job_docs = query.stream()
    
    jobs = []
    for doc in job_docs:
        job_data = doc.to_dict()
        job_data["id"] = doc.id
        jobs.append(Job(**job_data))
    
    # Calculate stats
    total_jobs = len(jobs)
    active_jobs = [j for j in jobs if j.workflowState != JobWorkflowState.CLOSED]
    roofing_complete_jobs = [j for j in jobs if j.workflowState == JobWorkflowState.ROOFING_COMPLETE]
    ready_for_reset = [j for j in jobs if j.workflowState == JobWorkflowState.READY_FOR_RESET]
    
    return {
        "totalJobs": total_jobs,
        "activeJobs": len(active_jobs),
        "roofingCompleteJobs": len(roofing_complete_jobs),
        "readyForReset": len(ready_for_reset),
        "recentJobs": jobs[:10]
    }


@router.get("/roofer/jobs", response_model=List[Job])
async def get_roofer_jobs(
    current_user: User = Depends(require_role([UserRole.PARTNER]))
):
    """Get all jobs for the authenticated roofer."""
    if not current_user.partnerId:
        raise HTTPException(status_code=400, detail="Partner ID not found for user")
    
    jobs_ref = db.collection("jobs")
    query = jobs_ref.where(filter=FieldFilter("partnerId", "==", current_user.partnerId))
    docs = query.stream()
    
    jobs = []
    for doc in docs:
        job_data = doc.to_dict()
        job_data["id"] = doc.id
        jobs.append(Job(**job_data))
    
    return jobs


@router.post("/roofer/jobs/{job_id}/roof-complete")
async def mark_roof_complete(
    job_id: str,
    current_user: User = Depends(require_role([UserRole.PARTNER]))
):
    """Mark a job's roof as complete. Transitions job to ROOFING_COMPLETE state."""
    if not current_user.partnerId:
        raise HTTPException(status_code=400, detail="Partner ID not found for user")
    
    job_ref = db.collection("jobs").document(job_id)
    job_doc = job_ref.get()
    
    if not job_doc.exists:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job_data = job_doc.to_dict()
    
    # Verify this job belongs to the partner
    if job_data.get("partnerId") != current_user.partnerId:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Transition to ROOFING_COMPLETE
    current_state = JobWorkflowState(job_data.get("workflowState", JobWorkflowState.INTAKE_QUOTING))
    
    if current_state != JobWorkflowState.DETACH_COMPLETE_HOLD:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot mark roof complete from state: {current_state.value}"
        )
    
    update_payload = {
        "workflowState": JobWorkflowState.ROOFING_COMPLETE.value,
        "roofingCompletedAt": datetime.utcnow()
    }
    
    job_ref.update(update_payload)
    
    # Create notification
    notification = Notification(
        userId=current_user.id,
        userRole=UserRole.ADMIN,  # Notify admin
        title="Roof Complete",
        message=f"Job {job_id} roof work has been marked complete by {current_user.email}",
        type="success",
        relatedEntityType="job",
        relatedEntityId=job_id
    )
    notification_dict = notification.model_dump(exclude={"id"})
    db.collection("notifications").add(notification_dict)
    
    return {"message": "Roof marked as complete", "jobId": job_id}


# ---------- Notifications ----------

@router.get("/notifications", response_model=List[Notification])
async def get_notifications(
    current_user: User = Depends(get_current_active_user)
):
    """Get notifications for the current user."""
    notifications_ref = db.collection("notifications")
    query = notifications_ref.where(filter=FieldFilter("userId", "==", current_user.id))
    docs = query.stream()
    
    notifications = []
    for doc in docs:
        notif_data = doc.to_dict()
        notif_data["id"] = doc.id
        notifications.append(Notification(**notif_data))
    
    # Sort by created date descending
    notifications.sort(key=lambda x: x.createdAt, reverse=True)
    
    return notifications


@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Mark a notification as read."""
    notif_ref = db.collection("notifications").document(notification_id)
    notif_doc = notif_ref.get()
    
    if not notif_doc.exists:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif_data = notif_doc.to_dict()
    if notif_data.get("userId") != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    notif_ref.update({"isRead": True})
    return {"message": "Notification marked as read"}

