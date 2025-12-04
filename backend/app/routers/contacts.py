from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.schemas import Contact
from app.main import db
from google.cloud.firestore_v1.base_query import FieldFilter

router = APIRouter(prefix="/contacts", tags=["contacts"])

@router.post("/", response_model=Contact)
async def create_contact(contact: Contact):
    contact_dict = contact.model_dump(exclude={"id"})
    update_time, contact_ref = db.collection("contacts").add(contact_dict)
    contact.id = contact_ref.id
    return contact

@router.get("/", response_model=List[Contact])
async def get_contacts(partnerId: Optional[str] = None, search: Optional[str] = None):
    contacts_ref = db.collection("contacts")
    
    if partnerId:
        query = contacts_ref.where(filter=FieldFilter("partnerId", "==", partnerId))
        docs = query.stream()
    else:
        docs = contacts_ref.stream()
        
    contacts = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        
        # Client-side filtering for search if needed (Firestore search is limited)
        if search:
            search_lower = search.lower()
            if (search_lower in data.get("firstName", "").lower() or 
                search_lower in data.get("lastName", "").lower() or 
                search_lower in data.get("email", "").lower() or
                search_lower in data.get("partnerName", "").lower()):
                contacts.append(Contact(**data))
        else:
            contacts.append(Contact(**data))
            
    return contacts

@router.get("/{contact_id}", response_model=Contact)
async def get_contact(contact_id: str):
    doc_ref = db.collection("contacts").document(contact_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    data = doc.to_dict()
    data["id"] = doc.id
    return Contact(**data)

@router.put("/{contact_id}", response_model=Contact)
async def update_contact(contact_id: str, contact: Contact):
    doc_ref = db.collection("contacts").document(contact_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    data = contact.model_dump(exclude={"id"})
    doc_ref.update(data)
    contact.id = contact_id
    return contact

@router.delete("/{contact_id}")
async def delete_contact(contact_id: str):
    doc_ref = db.collection("contacts").document(contact_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    doc_ref.delete()
    return {"message": "Contact deleted successfully"}
