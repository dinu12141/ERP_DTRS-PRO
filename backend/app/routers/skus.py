from fastapi import APIRouter, HTTPException
from typing import List
from app.models.schemas import ProductServiceSKU, SKUType
from app.main import db
from google.cloud.firestore_v1.base_query import FieldFilter

router = APIRouter(prefix="/skus", tags=["skus"])


@router.post("/", response_model=ProductServiceSKU)
async def create_sku(sku: ProductServiceSKU):
    """Create a new product or service SKU."""
    sku_dict = sku.model_dump(exclude={"id"})
    
    # Check for duplicate SKU code
    existing = db.collection("skus").where(filter=FieldFilter("sku", "==", sku.sku)).limit(1).stream()
    if list(existing):
        raise HTTPException(status_code=400, detail=f"SKU code '{sku.sku}' already exists")
    
    _, sku_ref = db.collection("skus").add(sku_dict)
    sku.id = sku_ref.id
    return sku


@router.get("/", response_model=List[ProductServiceSKU])
async def get_skus(
    type: SKUType = None,
    category: str = None,
    isActive: bool = None,
    search: str = None
):
    """List all SKUs with optional filters."""
    skus_ref = db.collection("skus")
    query = skus_ref
    
    if type:
        query = query.where(filter=FieldFilter("type", "==", type.value))
    if category:
        query = query.where(filter=FieldFilter("category", "==", category))
    if isActive is not None:
        query = query.where(filter=FieldFilter("isActive", "==", isActive))
    
    docs = query.stream()
    
    skus = []
    for doc in docs:
        sku_data = doc.to_dict()
        sku_data["id"] = doc.id
        
        # In-memory search filter
        if search:
            search_lower = search.lower()
            if not (
                search_lower in sku_data.get("sku", "").lower() or
                search_lower in sku_data.get("name", "").lower() or
                search_lower in sku_data.get("description", "").lower()
            ):
                continue
        
        skus.append(ProductServiceSKU(**sku_data))
    
    return skus


@router.get("/{sku_id}", response_model=ProductServiceSKU)
async def get_sku(sku_id: str):
    """Get a single SKU by ID."""
    doc_ref = db.collection("skus").document(sku_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="SKU not found")
    
    sku_data = doc.to_dict()
    sku_data["id"] = doc.id
    return ProductServiceSKU(**sku_data)


@router.put("/{sku_id}", response_model=ProductServiceSKU)
async def update_sku(sku_id: str, sku: ProductServiceSKU):
    """Update an existing SKU."""
    doc_ref = db.collection("skus").document(sku_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="SKU not found")
    
    # Check for duplicate SKU code (excluding current doc)
    existing = db.collection("skus").where(filter=FieldFilter("sku", "==", sku.sku)).stream()
    for existing_doc in existing:
        if existing_doc.id != sku_id:
            raise HTTPException(status_code=400, detail=f"SKU code '{sku.sku}' already exists")
    
    data = sku.model_dump(exclude={"id"})
    doc_ref.update(data)
    sku.id = sku_id
    return sku


@router.delete("/{sku_id}")
async def delete_sku(sku_id: str):
    """Delete a SKU (soft delete by setting isActive=False)."""
    doc_ref = db.collection("skus").document(sku_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="SKU not found")
    
    doc_ref.update({"isActive": False})
    return {"message": "SKU deactivated successfully"}

