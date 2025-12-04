from typing import List

from fastapi import APIRouter, HTTPException

from app.main import db
from app.models.schemas import Crew


router = APIRouter(prefix="/crews", tags=["crews"])


@router.post("/", response_model=Crew)
async def create_crew(crew: Crew):
    data = crew.model_dump(exclude={"id"})
    _, ref = db.collection("crews").add(data)
    crew.id = ref.id
    return crew


@router.get("/", response_model=List[Crew])
async def list_crews():
    docs = db.collection("crews").stream()
    crews: List[Crew] = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        crews.append(Crew(**data))
    return crews


@router.get("/{crew_id}", response_model=Crew)
async def get_crew(crew_id: str):
    snap = db.collection("crews").document(crew_id).get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Crew not found")
    data = snap.to_dict()
    data["id"] = snap.id
    return Crew(**data)


@router.put("/{crew_id}", response_model=Crew)
async def update_crew(crew_id: str, crew: Crew):
    ref = db.collection("crews").document(crew_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Crew not found")
    data = crew.model_dump(exclude={"id"})
    ref.update(data)
    crew.id = crew_id
    return crew


@router.delete("/{crew_id}")
async def delete_crew(crew_id: str):
    ref = db.collection("crews").document(crew_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Crew not found")
    ref.delete()
    return {"deleted": True}


