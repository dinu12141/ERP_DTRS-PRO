from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends, Header, Query
from google.cloud.firestore_v1.base_query import FieldFilter

from app.main import db
from app.models.schemas import Lead, LeadStatus


router = APIRouter(prefix="/leads", tags=["leads"])


def get_user_role(x_user_role: Optional[str] = Header(default="user")) -> str:
    return x_user_role.lower()


def require_sales(role: str = Depends(get_user_role)) -> None:
    if role not in ("admin", "manager", "sales"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")


@router.post("/", response_model=Lead, dependencies=[Depends(require_sales)])
async def create_lead(lead: Lead):
    data = lead.model_dump(exclude={"id"})
    _, ref = db.collection("leads").add(data)
    lead.id = ref.id
    return lead


@router.get("/", response_model=List[Lead])
async def list_leads(
    status: Optional[LeadStatus] = None,
    partnerId: Optional[str] = Query(default=None, alias="partnerId"),
    search: Optional[str] = None,
):
    col = db.collection("leads")

    if status:
        col = col.where(filter=FieldFilter("status", "==", status.value))

    if partnerId:
        col = col.where(filter=FieldFilter("partnerId", "==", partnerId))

    docs = col.stream()
    leads: List[Lead] = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id

        # In-memory search on customerName, address, email
        if search:
            term = search.lower()
            if not (
                str(data.get("customerName", "")).lower().find(term) != -1
                or str(data.get("address", "")).lower().find(term) != -1
                or str(data.get("email", "")).lower().find(term) != -1
            ):
                continue

        leads.append(Lead(**data))

    return leads


@router.get("/{lead_id}", response_model=Lead)
async def get_lead(lead_id: str):
    doc = db.collection("leads").document(lead_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Lead not found")
    data = doc.to_dict()
    data["id"] = doc.id
    return Lead(**data)


@router.put("/{lead_id}", response_model=Lead, dependencies=[Depends(require_sales)])
async def update_lead(lead_id: str, lead: Lead):
    doc_ref = db.collection("leads").document(lead_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Lead not found")

    data = lead.model_dump(exclude={"id"})
    doc_ref.update(data)
    lead.id = lead_id
    return lead


@router.delete("/{lead_id}", dependencies=[Depends(require_sales)])
async def delete_lead(lead_id: str):
    doc_ref = db.collection("leads").document(lead_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Lead not found")
    doc_ref.delete()
    return {"deleted": True}


