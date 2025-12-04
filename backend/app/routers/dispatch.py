from typing import List, Optional
import requests
import os

from fastapi import APIRouter, HTTPException, Query

from app.main import db
from app.models.schemas import (
    ScheduleEntry,
    ScheduleType,
    Job,
    validate_schedule_constraints,
)


router = APIRouter(prefix="/dispatch", tags=["dispatch"])


async def _get_job(job_id: str) -> Job:
    snap = db.collection("jobs").document(job_id).get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Job not found for schedule entry")
    data = snap.to_dict()
    data["id"] = snap.id
    return Job(**data)


async def _fetch_weather_for_job(job: Job, date: str) -> Optional[dict]:
    """Fetch weather data for a job location and date."""
    try:
        # Get job address coordinates (would need geocoding in production)
        # For now, use a default location or get from job.address
        # In production, geocode the address to get lat/lon
        
        # Mock weather for now - replace with actual API call
        # weather_api = os.environ.get("WEATHER_API_URL", "http://localhost:8000/weather/forecast")
        # response = requests.get(weather_api, params={"lat": lat, "lon": lon, "date": date})
        
        return {
            "condition": "Clear",
            "temperature": 75,
            "humidity": 60,
            "windSpeed": 10,
            "precipitation": 0,
        }
    except:
        return None


@router.post("/schedule", response_model=ScheduleEntry)
async def create_schedule(entry: ScheduleEntry):
    # Validate against job workflow/milestones
    job = await _get_job(entry.jobId)
    try:
        validate_schedule_constraints(job, entry)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # Fetch weather data for the schedule date
    weather = await _fetch_weather_for_job(job, entry.date)
    
    data = entry.model_dump(exclude={"id"})
    if weather:
        data["weather"] = weather
    
    _, ref = db.collection("schedule").add(data)
    entry.id = ref.id
    if weather:
        entry.weather = weather
    return entry


@router.get("/schedule", response_model=List[ScheduleEntry])
async def list_schedule(
    date: Optional[str] = Query(default=None),
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    crew_id: Optional[str] = Query(default=None)
):
    """List schedule entries with optional filters."""
    col = db.collection("schedule")
    
    if date:
        col = col.where("date", "==", date)
    elif start_date and end_date:
        col = col.where("date", ">=", start_date).where("date", "<=", end_date)
    
    if crew_id:
        col = col.where("crewId", "==", crew_id)

    docs = col.stream()
    items: List[ScheduleEntry] = []
    for d in docs:
        data = d.to_dict()
        data["id"] = d.id
        items.append(ScheduleEntry(**data))
    return items


@router.put("/schedule/{entry_id}", response_model=ScheduleEntry)
async def update_schedule(entry_id: str, entry: ScheduleEntry):
    ref = db.collection("schedule").document(entry_id)
    snap = ref.get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Schedule entry not found")

    job = await _get_job(entry.jobId)
    try:
        validate_schedule_constraints(job, entry)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    data = entry.model_dump(exclude={"id"})
    ref.update(data)
    entry.id = entry_id
    return entry


@router.delete("/schedule/{entry_id}")
async def delete_schedule(entry_id: str):
    ref = db.collection("schedule").document(entry_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Schedule entry not found")
    ref.delete()
    return {"deleted": True}


