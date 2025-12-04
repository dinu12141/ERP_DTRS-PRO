from fastapi import APIRouter, HTTPException
from typing import List
from app.models.schemas import Invoice, InvoiceStatus, InvoiceType
from app.main import db
from google.cloud.firestore_v1.base_query import FieldFilter
from datetime import datetime, timedelta

router = APIRouter(prefix="/invoices", tags=["invoices"])


def calculate_invoice_totals(line_items: List, tax_rate: float = 0) -> dict:
    """Calculate subtotal, tax, and total for an invoice."""
    subtotal = sum(item.get("total", 0) for item in line_items)
    tax_amount = subtotal * tax_rate
    total = subtotal + tax_amount
    return {
        "subtotal": round(subtotal, 2),
        "taxAmount": round(tax_amount, 2),
        "total": round(total, 2)
    }


@router.post("/", response_model=Invoice)
async def create_invoice(invoice: Invoice):
    """Create a new invoice. Totals are auto-calculated from line items."""
    # Recalculate totals
    line_items_dict = [item.model_dump() if hasattr(item, "model_dump") else item for item in invoice.lineItems]
    totals = calculate_invoice_totals(line_items_dict, invoice.taxRate)
    invoice.subtotal = totals["subtotal"]
    invoice.taxAmount = totals["taxAmount"]
    invoice.total = totals["total"]
    invoice.balanceDue = invoice.total - invoice.paidAmount
    
    invoice_dict = invoice.model_dump(exclude={"id"})
    _, invoice_ref = db.collection("invoices").add(invoice_dict)
    invoice.id = invoice_ref.id
    return invoice


@router.get("/", response_model=List[Invoice])
async def get_invoices(
    jobId: str = None,
    status: InvoiceStatus = None,
    type: InvoiceType = None
):
    """List invoices with optional filters."""
    invoices_ref = db.collection("invoices")
    query = invoices_ref
    
    if jobId:
        query = query.where(filter=FieldFilter("jobId", "==", jobId))
    if status:
        query = query.where(filter=FieldFilter("status", "==", status.value))
    if type:
        query = query.where(filter=FieldFilter("type", "==", type.value))
    
    docs = query.stream()
    
    invoices = []
    for doc in docs:
        inv_data = doc.to_dict()
        inv_data["id"] = doc.id
        invoices.append(Invoice(**inv_data))
    
    return invoices


@router.get("/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str):
    """Get a single invoice by ID."""
    doc_ref = db.collection("invoices").document(invoice_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    inv_data = doc.to_dict()
    inv_data["id"] = doc.id
    return Invoice(**inv_data)


@router.put("/{invoice_id}", response_model=Invoice)
async def update_invoice(invoice_id: str, invoice: Invoice):
    """Update an invoice. Totals are recalculated."""
    doc_ref = db.collection("invoices").document(invoice_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Recalculate totals
    line_items_dict = [item.model_dump() if hasattr(item, "model_dump") else item for item in invoice.lineItems]
    totals = calculate_invoice_totals(line_items_dict, invoice.taxRate)
    invoice.subtotal = totals["subtotal"]
    invoice.taxAmount = totals["taxAmount"]
    invoice.total = totals["total"]
    invoice.balanceDue = invoice.total - invoice.paidAmount
    
    data = invoice.model_dump(exclude={"id"})
    doc_ref.update(data)
    invoice.id = invoice_id
    return invoice


@router.post("/{invoice_id}/generate-pdf")
async def trigger_pdf_generation(invoice_id: str):
    """Trigger PDF generation for an invoice (Cloud Function will handle actual generation)."""
    doc_ref = db.collection("invoices").document(invoice_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Set a flag that Cloud Function will pick up
    doc_ref.update({"pdfGenerationRequested": True, "pdfGenerationRequestedAt": datetime.utcnow()})
    return {"message": "PDF generation requested", "invoiceId": invoice_id}

