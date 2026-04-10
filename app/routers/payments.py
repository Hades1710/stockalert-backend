from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Dict, Any
from app.database import supabase
from app.config import settings
import logging

try:
    from dodopayments import DodoPayments
    if settings.DODO_PAYMENTS_API_KEY:
        dodo = DodoPayments(bearer_token=settings.DODO_PAYMENTS_API_KEY, environment="test_mode")
    else:
        dodo = None
except ImportError:
    dodo = None

router = APIRouter(prefix="/payments", tags=["payments"])
logger = logging.getLogger(__name__)

class CheckoutRequest(BaseModel):
    tier: str # "plus" or "pro"
    user_id: str

@router.post("/create-checkout-session")
async def create_checkout_session(req: CheckoutRequest):
    if not dodo:
        raise HTTPException(status_code=500, detail="Dodo SDK not installed or misconfigured")

    product_id = settings.DODO_PLUS_PRODUCT_ID if req.tier == "plus" else settings.DODO_PRO_PRODUCT_ID
    if not product_id:
        raise HTTPException(status_code=500, detail="Product ID missing in config")

    # Fetch user profile for minimal customer details
    user_res = supabase.table("profiles").select("email").eq("id", req.user_id).execute()
    email = user_res.data[0].get("email") if user_res.data else "guest@example.com"

    try:
        # Create a subscription payment link in Dodo
        # Based on default SDK behavior
        session = dodo.subscriptions.create(
            billing={"country": "US", "city": "NY", "state": "NY", "street": "Broadway", "zipcode": "10001"},
            customer={"email": email, "name": "StockAlert User"},
            product_id=product_id,
            quantity=1,
            payment_link=True,
            return_url="http://localhost:3000/dashboard?payment=success",
            metadata={"user_id": req.user_id, "tier": req.tier}
        )
        
        # Depending on Dodo's specific response wrapper, payment link exists on the object
        # It's usually `payment_link` or `url`
        url = getattr(session, 'payment_link', None)
        if not url:
            # Fallback if standard parsing fails
            url = session.model_dump().get("payment_link")
            
        return {"checkout_url": url}

    except Exception as e:
        logger.error(f"Dodo payments creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def dodo_webhook(request: Request):
    payload = await request.body()
    headers = request.headers
    
    # We must cast headers to a dict of strings for Dodo's unwrap
    header_dict = {k: str(v) for k, v in headers.items()}
    
    try:
        # Verify and unwrap webhook payload securely
        event = dodo.webhooks.unwrap(
            payload=payload.decode("utf-8"),
            headers=header_dict,
            key=settings.DODO_PAYMENTS_WEBHOOK_SECRET
        )
        
        # We handle standard subscription events
        event_type = getattr(event, 'type', event.get('type') if isinstance(event, dict) else None)
        event_data = getattr(event, 'data', event.get('data') if isinstance(event, dict) else None)
        
        logger.info(f"DODO WEBHOOK RECEIVED: {event_type}")

        if event_type in ["subscription.active", "subscription.renewed"]:
            # Parse metadata
            metadata = getattr(event_data, 'metadata', event_data.get('metadata', {}))
            user_id = metadata.get("user_id")
            tier = metadata.get("tier", "plus")
            
            dodo_id = getattr(event_data, 'subscription_id', event_data.get('subscription_id', ""))

            if user_id:
                # Upgrade user instantly
                supabase.table("profiles").update({
                    "tier": tier,
                    "dodo_subscription_id": dodo_id
                }).eq("id", user_id).execute()
                logger.info(f"User {user_id} upgraded to {tier}")

        elif event_type == "subscription.canceled":
            metadata = getattr(event_data, 'metadata', event_data.get('metadata', {}))
            user_id = metadata.get("user_id")
            if user_id:
                # Downgrade user instantly
                supabase.table("profiles").update({
                    "tier": "free",
                    "dodo_subscription_id": None
                }).eq("id", user_id).execute()
                logger.info(f"User {user_id} downgraded to free")

    except Exception as e:
        logger.error(f"Webhook verification failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")

    return {"status": "success"}
