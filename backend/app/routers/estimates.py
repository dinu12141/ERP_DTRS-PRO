from fastapi import APIRouter, HTTPException
from typing import List
from app.models.schemas import Estimate, EstimateLineItem
from app.main import db
from google.cloud.firestore_v1.base_query import FieldFilter

router = APIRouter(prefix="/estimates", tags=["estimates"])


def calculate_estimate_totals(line_items: List[EstimateLineItem], tax_rate: float = 0) -> dict:
    """Calculate subtotal, tax, and total for an estimate."""
    subtotal = sum(item.total for item in line_items)
    tax_amount = subtotal * tax_rate
    total = subtotal + tax_amount
    return {
        "subtotal": round(subtotal, 2),
        "taxAmount": round(tax_amount, 2),
        "total": round(total, 2)
    }


@router.post("/", response_model=Estimate)
async def create_estimate(estimate: Estimate):
    """Create a new estimate. Totals are auto-calculated from line items."""
    # Recalculate totals
    totals = calculate_estimate_totals(estimate.lineItems, estimate.taxRate)
    estimate.subtotal = totals["subtotal"]
    estimate.taxAmount = totals["taxAmount"]
    estimate.total = totals["total"]
    
    estimate_dict = estimate.model_dump(exclude={"id"})
    _, estimate_ref = db.collection("estimates").add(estimate_dict)
    estimate.id = estimate_ref.id
    return estimate


@router.get("/", response_model=List[Estimate])
async def get_estimates(jobId: str = None, status: str = None):
    """List estimates with optional filters."""
    estimates_ref = db.collection("estimates")
    query = estimates_ref
    
    if jobId:
        query = query.where(filter=FieldFilter("jobId", "==", jobId))
    if status:
        query = query.where(filter=FieldFilter("status", "==", status))
    
    docs = query.stream()
    
    estimates = []
    for doc in docs:
        est_data = doc.to_dict()
        est_data["id"] = doc.id
        estimates.append(Estimate(**est_data))
    
    return estimates


@router.get("/{estimate_id}", response_model=Estimate)
async def get_estimate(estimate_id: str):
    """Get a single estimate by ID."""
    doc_ref = db.collection("estimates").document(estimate_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Estimate not found")
    
    est_data = doc.to_dict()
    est_data["id"] = doc.id
    return Estimate(**est_data)


@router.put("/{estimate_id}", response_model=Estimate)
async def update_estimate(estimate_id: str, estimate: Estimate):
    """Update an estimate. Totals are recalculated."""
    doc_ref = db.collection("estimates").document(estimate_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Estimate not found")
    
    # Recalculate totals
    totals = calculate_estimate_totals(estimate.lineItems, estimate.taxRate)
    estimate.subtotal = totals["subtotal"]
    estimate.taxAmount = totals["taxAmount"]
    estimate.total = totals["total"]
    
    data = estimate.model_dump(exclude={"id"})
    doc_ref.update(data)
    estimate.id = estimate_id
    return estimate


@router.post("/{estimate_id}/calculate", response_model=Estimate)
async def recalculate_estimate(estimate_id: str, tax_rate: float = 0):
    """Recalculate estimate totals from line items."""
    doc_ref = db.collection("estimates").document(estimate_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Estimate not found")
    
    est_data = doc.to_dict()
    line_items = [EstimateLineItem(**item) for item in est_data.get("lineItems", [])]
    
    totals = calculate_estimate_totals(line_items, tax_rate)
    doc_ref.update({
        "taxRate": tax_rate,
        **totals
    })
    
    updated = doc_ref.get().to_dict()
    updated["id"] = estimate_id
    return Estimate(**updated)


@router.post("/{estimate_id}/create-invoice")
async def create_invoice_from_estimate(estimate_id: str, invoice_type: str = "Deposit"):
    """Create an invoice from an estimate."""
    from app.models.schemas import Invoice, InvoiceType, InvoiceStatus
    from datetime import datetime, timedelta
    
    doc_ref = db.collection("estimates").document(estimate_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Estimate not found")
    
    est_data = doc.to_dict()
    
    # Calculate invoice amount based on type
    total_amount = est_data.get("total", 0)
    if invoice_type == "Deposit":
        invoice_amount = total_amount * 0.3
    elif invoice_type == "Progress":
        invoice_amount = total_amount * 0.4
    elif invoice_type == "Final":
        invoice_amount = total_amount * 0.3
    else:
        invoice_amount = total_amount
    
    # Create invoice line items from estimate
    invoice_line_items = []
    for item in est_data.get("lineItems", []):
        # Calculate proportional amount for this invoice type
        item_total = item.get("total", 0)
        if invoice_type == "Deposit":
            item_amount = item_total * 0.3
        elif invoice_type == "Progress":
            item_amount = item_total * 0.4
        elif invoice_type == "Final":
            item_amount = item_total * 0.3
        else:
            item_amount = item_total
        
        invoice_line_items.append({
            "description": item.get("description", ""),
            "quantity": item.get("quantity", 0),
            "unitPrice": item_amount / item.get("quantity", 1) if item.get("quantity", 0) > 0 else 0,
            "unit": item.get("unit", "each"),
            "total": item_amount
        })
    
    # Generate invoice number
    invoice_number = f"INV-{datetime.now().year}-{str(datetime.now().timestamp()).split('.')[0][-6:]}"
    
    # Create invoice
    invoice_data = {
        "invoiceNumber": invoice_number,
        "jobId": est_data.get("jobId", ""),
        "customerId": est_data.get("customerId", ""),
        "customerName": est_data.get("customerName", "Customer"),
        "partnerId": est_data.get("partnerId"),
        "partnerName": est_data.get("partnerName"),
        "type": InvoiceType(invoice_type),
        "status": InvoiceStatus.PENDING,
        "lineItems": invoice_line_items,
        "subtotal": invoice_amount,
        "taxRate": est_data.get("taxRate", 0),
        "taxAmount": invoice_amount * est_data.get("taxRate", 0),
        "total": invoice_amount + (invoice_amount * est_data.get("taxRate", 0)),
        "paidAmount": 0,
        "balanceDue": invoice_amount + (invoice_amount * est_data.get("taxRate", 0)),
        "dueDate": (datetime.now() + timedelta(days=30)).isoformat(),
        "notes": f"Invoice created from estimate {estimate_id}",
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    }
    
    _, invoice_ref = db.collection("invoices").add(invoice_data)
    invoice_data["id"] = invoice_ref.id
    
    return {"invoice": invoice_data, "message": f"Invoice {invoice_number} created successfully"}
