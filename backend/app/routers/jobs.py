from fastapi import APIRouter, HTTPException
from typing import List
from app.models.schemas import (
    Job,
    JobStatus,
    JobWorkflowState,
    JobPhoto,
    validate_job_state_transition,
)
from app.main import db
from google.cloud.firestore_v1.base_query import FieldFilter

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.post("/", response_model=Job)
async def create_job(job: Job):
    job_dict = job.model_dump(exclude={"id"})
    # Firestore handles datetime serialization automatically if using the admin SDK correctly,
    # but sometimes it's safer to convert to native datetime or server timestamp.
    # Pydantic's datetime is fine.
    
    update_time, job_ref = db.collection("jobs").add(job_dict)
    job.id = job_ref.id
    return job

@router.get("/", response_model=List[Job])
async def get_jobs(status: JobStatus = None):
    jobs_ref = db.collection("jobs")
    if status:
        query = jobs_ref.where(filter=FieldFilter("status", "==", status.value))
        docs = query.stream()
    else:
        docs = jobs_ref.stream()
        
    jobs: List[Job] = []
    for doc in docs:
        job_data = doc.to_dict()
        job_data["id"] = doc.id
        jobs.append(Job(**job_data))
    return jobs

@router.get("/{job_id}", response_model=Job)
async def get_job(job_id: str):
    doc_ref = db.collection("jobs").document(job_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job_data = doc.to_dict()
    job_data["id"] = doc.id
    return Job(**job_data)


@router.put("/{job_id}", response_model=Job)
async def update_job(job_id: str, job: Job):
    """
    Full update of a job record with workflow state validation.
    """
    doc_ref = db.collection("jobs").document(job_id)
    snap = doc_ref.get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = snap.to_dict()
    existing_state = JobWorkflowState(existing.get("workflowState", JobWorkflowState.INTAKE_QUOTING))
    new_state = job.workflowState

    try:
        validate_job_state_transition(existing_state, new_state)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    data = job.model_dump(exclude={"id"})
    doc_ref.update(data)
    job.id = job_id
    return job


@router.post("/{job_id}/transition", response_model=Job)
async def transition_job(job_id: str, new_state: JobWorkflowState):
    """
    Convenience endpoint to transition a job workflow state only.
    """
    doc_ref = db.collection("jobs").document(job_id)
    snap = doc_ref.get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Job not found")

    data = snap.to_dict()
    current_state = JobWorkflowState(data.get("workflowState", JobWorkflowState.INTAKE_QUOTING))

    try:
        validate_job_state_transition(current_state, new_state)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    update_payload = {"workflowState": new_state.value}

    # Set milestone timestamps when we first reach a state
    from datetime import datetime

    now = datetime.utcnow()
    if new_state == JobWorkflowState.SITE_SURVEY_COMPLETE and not data.get("siteSurveyCompletedAt"):
        update_payload["siteSurveyCompletedAt"] = now
    elif new_state == JobWorkflowState.PERMIT_SUBMITTED and not data.get("permitSubmittedAt"):
        update_payload["permitSubmittedAt"] = now
    elif new_state == JobWorkflowState.PERMIT_APPROVED and not data.get("permitApprovedAt"):
        update_payload["permitApprovedAt"] = now
    elif new_state == JobWorkflowState.SCHEDULED_DETACH and not data.get("detachScheduledAt"):
        update_payload["detachScheduledAt"] = now
    elif new_state == JobWorkflowState.DETACH_COMPLETE_HOLD and not data.get("detachCompletedAt"):
        update_payload["detachCompletedAt"] = now
    elif new_state == JobWorkflowState.ROOFING_COMPLETE and not data.get("roofingCompletedAt"):
        update_payload["roofingCompletedAt"] = now
    elif new_state == JobWorkflowState.SCHEDULED_RESET and not data.get("resetScheduledAt"):
        update_payload["resetScheduledAt"] = now
    elif new_state == JobWorkflowState.RESET_COMPLETE and not data.get("resetCompletedAt"):
        update_payload["resetCompletedAt"] = now
    elif new_state == JobWorkflowState.INSPECTION_PTO_PASSED and not data.get("inspectionPtoPassedAt"):
        update_payload["inspectionPtoPassedAt"] = now
    elif new_state == JobWorkflowState.CLOSED and not data.get("closedAt"):
        update_payload["closedAt"] = now

    doc_ref.update(update_payload)

    # Return updated job
    updated = doc_ref.get().to_dict()
    updated["id"] = job_id
    return Job(**updated)


@router.post("/{job_id}/photos", response_model=Job)
async def add_job_photo(job_id: str, photo: JobPhoto):
    """
    Append a system photo (already uploaded to storage) to the job record.
    """
    doc_ref = db.collection("jobs").document(job_id)
    snap = doc_ref.get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Job not found")

    data = snap.to_dict() or {}
    photos = data.get("photos", [])
    photos.append(photo.model_dump())

    doc_ref.update({"photos": photos})

    updated = doc_ref.get().to_dict()
    updated["id"] = job_id
    return Job(**updated)
