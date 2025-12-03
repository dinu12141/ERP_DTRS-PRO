from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models.schemas import Job, JobStatus
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
        
    jobs = []
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
