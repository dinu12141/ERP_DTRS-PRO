from fastapi import APIRouter, HTTPException, Depends, Form
from typing import Optional
import stripe
import os
from app.models.schemas import PaymentIntent
from app.routers.auth import get_current_active_user, require_role, User
from app.models.schemas import UserRole
from app.main import db
from google.cloud.firestore_v1.base_query import FieldFilter

router = APIRouter(prefix="/payments", tags=["payments"])

# Initialize Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "sk_test_...")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")


@router.post("/create-intent")
async def create_payment_intent(
    invoice_id: str = Form(...),
    current_user: User = Depends(require_role([UserRole.HOMEOWNER]))
):
    """Create a Stripe payment intent for an invoice."""
    if not current_user.customerId:
        raise HTTPException(status_code=400, detail="Customer ID not found for user")
    
    # Get invoice
    invoice_ref = db.collection("invoices").document(invoice_id)
    invoice_doc = invoice_ref.get()
    
    if not invoice_doc.exists:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    invoice_data = invoice_doc.to_dict()
    if invoice_data.get("customerId") != current_user.customerId:
        raise HTTPException(status_code=403, detail="Access denied")
    
    amount = int(invoice_data.get("balanceDue", invoice_data.get("total", 0)) * 100)  # Convert to cents
    
    try:
        # Create Stripe payment intent
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency="usd",
            metadata={
                "invoice_id": invoice_id,
                "customer_id": current_user.customerId,
                "user_id": current_user.id
            }
        )
        
        # Save payment intent to database
        payment_intent = PaymentIntent(
            invoiceId=invoice_id,
            customerId=current_user.customerId,
            amount=invoice_data.get("balanceDue", invoice_data.get("total", 0)),
            stripePaymentIntentId=intent.id,
            status="pending"
        )
        
        payment_dict = payment_intent.model_dump(exclude={"id"})
        _, payment_ref = db.collection("payment_intents").add(payment_dict)
        payment_intent.id = payment_ref.id
        
        return {
            "clientSecret": intent.client_secret,
            "paymentIntentId": intent.id,
            "amount": amount / 100
        }
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: dict):
    """Handle Stripe webhook events."""
    payload = request
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    if event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        invoice_id = payment_intent["metadata"].get("invoice_id")
        
        if invoice_id:
            # Update invoice payment status
            invoice_ref = db.collection("invoices").document(invoice_id)
            invoice_doc = invoice_ref.get()
            
            if invoice_doc.exists:
                invoice_data = invoice_doc.to_dict()
                paid_amount = payment_intent["amount"] / 100
                new_paid_amount = invoice_data.get("paidAmount", 0) + paid_amount
                balance_due = invoice_data.get("total", 0) - new_paid_amount
                
                update_data = {
                    "paidAmount": new_paid_amount,
                    "balanceDue": max(0, balance_due),
                    "paidDate": payment_intent["created"]
                }
                
                if balance_due <= 0:
                    update_data["status"] = "Paid"
                
                invoice_ref.update(update_data)
            
            # Update payment intent status
            payment_intents_ref = db.collection("payment_intents")
            query = payment_intents_ref.where(
                filter=FieldFilter("stripePaymentIntentId", "==", payment_intent["id"])
            )
            payment_docs = list(query.stream())
            
            if payment_docs:
                payment_docs[0].reference.update({"status": "succeeded"})
    
    return {"status": "success"}

