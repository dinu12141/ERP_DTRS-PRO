from typing import List

from fastapi import APIRouter, HTTPException

from app.main import db
from app.models.schemas import (
    InventoryItem,
    InventoryBin,
    InventoryActivity,
    InventoryActivityType,
)


router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("/items", response_model=List[InventoryItem])
async def list_items():
    docs = db.collection("inventoryItems").stream()
    items: List[InventoryItem] = []
    for d in docs:
        data = d.to_dict()
        data["id"] = d.id
        items.append(InventoryItem(**data))
    return items


@router.post("/items", response_model=InventoryItem)
async def create_item(item: InventoryItem):
    data = item.model_dump(exclude={"id"})
    _, ref = db.collection("inventoryItems").add(data)
    item.id = ref.id
    return item


@router.post("/bins/transfer", response_model=InventoryActivity)
async def transfer_between_bins(
    itemId: str,
    fromBinId: str,
    toBinId: str,
    quantity: int,
):
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")

    bins_col = db.collection("inventoryBins")
    from_ref = bins_col.document(fromBinId)
    to_ref = bins_col.document(toBinId)

    from_snap = from_ref.get()
    to_snap = to_ref.get()

    if not from_snap.exists or not to_snap.exists:
        raise HTTPException(status_code=404, detail="One or both bins not found")

    from_data = from_snap.to_dict()
    to_data = to_snap.to_dict()

    if from_data.get("itemId") != itemId or to_data.get("itemId") != itemId:
        raise HTTPException(status_code=400, detail="Bins must belong to the same item")

    if from_data.get("quantity", 0) < quantity:
        raise HTTPException(status_code=400, detail="Insufficient quantity in source bin")

    # Apply transfer
    from_ref.update({"quantity": from_data["quantity"] - quantity})
    to_ref.update({"quantity": to_data.get("quantity", 0) + quantity})

    # Log activity
    activity = InventoryActivity(
        itemId=itemId,
        type=InventoryActivityType.TRANSFER,
        quantityChange=0,  # net zero globally
        fromBinId=fromBinId,
        toBinId=toBinId,
        metadata={"quantity": quantity},
    )
    activity_data = activity.model_dump(exclude={"id"})
    _, log_ref = db.collection("inventoryActivity").add(activity_data)
    activity.id = log_ref.id
    return activity


