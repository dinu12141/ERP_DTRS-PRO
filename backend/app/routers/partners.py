from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends, Header
from google.cloud.firestore_v1.base_query import FieldFilter

from app.main import db
from app.models.schemas import RoofingPartner


router = APIRouter(prefix="/partners", tags=["partners"])


def get_user_role(x_user_role: Optional[str] = Header(default="user")) -> str:
    """
    Very simple role-based access placeholder.
    In a real system this would come from authenticated user claims.
    """
    return x_user_role.lower()


def require_admin(role: str = Depends(get_user_role)) -> None:
    if role not in ("admin", "manager"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")


@router.post("/", response_model=RoofingPartner, dependencies=[Depends(require_admin)])
async def create_partner(partner: RoofingPartner):
    data = partner.model_dump(exclude={"id"})
    _, ref = db.collection("roofingPartners").add(data)
    partner.id = ref.id
    return partner


@router.get("/", response_model=List[RoofingPartner])
async def list_partners(
    status: Optional[str] = None,
    search: Optional[str] = None,
):
    col = db.collection("roofingPartners")

    # Basic status filter
    if status:
        col = col.where(filter=FieldFilter("status", "==", status))

    docs = col.stream()
    partners: List[RoofingPartner] = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id

        # In-memory search across companyName and email
        if search:
            term = search.lower()
            if not (
                str(data.get("companyName", "")).lower().find(term) != -1
                or str(data.get("email", "")).lower().find(term) != -1
            ):
                continue

        partners.append(RoofingPartner(**data))

    return partners


@router.get("/{partner_id}", response_model=RoofingPartner)
async def get_partner(partner_id: str):
    doc = db.collection("roofingPartners").document(partner_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Partner not found")
    data = doc.to_dict()
    data["id"] = doc.id
    return RoofingPartner(**data)


@router.put("/{partner_id}", response_model=RoofingPartner, dependencies=[Depends(require_admin)])
async def update_partner(partner_id: str, partner: RoofingPartner):
    doc_ref = db.collection("roofingPartners").document(partner_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Partner not found")

    data = partner.model_dump(exclude={"id"})
    doc_ref.update(data)
    partner.id = partner_id
    return partner


@router.delete("/{partner_id}", dependencies=[Depends(require_admin)])
async def delete_partner(partner_id: str):
    doc_ref = db.collection("roofingPartners").document(partner_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Partner not found")
    doc_ref.delete()
    return {"deleted": True}


