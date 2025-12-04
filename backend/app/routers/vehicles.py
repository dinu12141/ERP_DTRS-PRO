from typing import List

from fastapi import APIRouter, HTTPException

from app.main import db
from app.models.schemas import Vehicle


router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.post("/", response_model=Vehicle)
async def create_vehicle(vehicle: Vehicle):
    data = vehicle.model_dump(exclude={"id"})
    _, ref = db.collection("vehicles").add(data)
    vehicle.id = ref.id
    return vehicle


@router.get("/", response_model=List[Vehicle])
async def list_vehicles():
    docs = db.collection("vehicles").stream()
    vehicles: List[Vehicle] = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        vehicles.append(Vehicle(**data))
    return vehicles


@router.get("/{vehicle_id}", response_model=Vehicle)
async def get_vehicle(vehicle_id: str):
    snap = db.collection("vehicles").document(vehicle_id).get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    data = snap.to_dict()
    data["id"] = snap.id
    return Vehicle(**data)


@router.put("/{vehicle_id}", response_model=Vehicle)
async def update_vehicle(vehicle_id: str, vehicle: Vehicle):
    ref = db.collection("vehicles").document(vehicle_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    data = vehicle.model_dump(exclude={"id"})
    ref.update(data)
    vehicle.id = vehicle_id
    return vehicle


@router.delete("/{vehicle_id}")
async def delete_vehicle(vehicle_id: str):
    ref = db.collection("vehicles").document(vehicle_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    ref.delete()
    return {"deleted": True}


