"""
Billing endpoints - Stripe integration
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
import stripe
from app.config import settings
from app.routers.auth import get_current_user

router = APIRouter()

# Initialize Stripe
if settings.stripe_api_key:
    stripe.api_key = settings.stripe_api_key

class CreateCheckoutRequest(BaseModel):
    price_id: str  # Stripe price ID
    success_url: str = "https://contextone.vercel.app/dashboard?upgraded=true"
    cancel_url: str = "https://contextone.vercel.app/dashboard/billing"

class CreateCheckoutResponse(BaseModel):
    checkout_url: str

@router.post("/create-checkout", response_model=CreateCheckoutResponse)
async def create_checkout_session(
    request: CreateCheckoutRequest,
    current_user: str = Depends(get_current_user)
):
    """Create Stripe checkout session for subscription"""
    if not settings.stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    try:
        # If price_id is actually a product ID, get the first price
        price_id = request.price_id
        if price_id.startswith('prod_'):
            # Fetch the product to get its default price
            product = stripe.Product.retrieve(price_id)
            if product.get('default_price'):
                price_id = product['default_price']
            else:
                raise HTTPException(status_code=400, detail="Product has no price. Create a price in Stripe first.")
        
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price": price_id,
                "quantity": 1
            }],
            mode="subscription",
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            metadata={
                "user_id": current_user
            },
            customer_email=None  # Will be set by Stripe based on auth
        )
        
        return CreateCheckoutResponse(checkout_url=session.url)
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/portal")
async def get_customer_portal(
    current_user: str = Depends(get_current_user)
):
    """Get Stripe customer portal URL"""
    if not settings.stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    # In production, you'd look up the Stripe customer ID from your database
    # For now, return a placeholder
    raise HTTPException(status_code=404, detail="No subscription found")

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    if not settings.stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    if event.type == "checkout.session.completed":
        session = event.data.object
        user_id = session.metadata.get("user_id")
        # Upgrade user to Pro/Team in database
        print(f"Upgrading user {user_id} to paid plan")
    
    elif event.type == "customer.subscription.deleted":
        subscription = event.data.object
        # Downgrade user to Free
        print(f"Downgrading subscription {subscription.id}")
    
    elif event.type == "invoice.payment_failed":
        invoice = event.data.object
        # Send payment failed email
        print(f"Payment failed for invoice {invoice.id}")
    
    return {"status": "received"}

@router.get("/subscription")
async def get_subscription(
    current_user: str = Depends(get_current_user)
):
    """Get current user's subscription status"""
    # In production, query database for subscription status
    return {
        "tier": "free",
        "status": "active",
        "current_period_end": None
    }