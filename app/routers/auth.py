from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import supabase
from app.schemas import UserProfile
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserProfile:
    token = credentials.credentials
    try:
        response = supabase.auth.get_user(token)
        user = response.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        prof_res = supabase.table("profiles").select("tier").eq("id", str(user.id)).execute()
        tier = prof_res.data[0].get("tier", "free") if prof_res.data else "free"
        
        return UserProfile(id=user.id, email=user.email, tier=tier)
    except Exception as e:
        logger.error(f"AUTH_FAILURE: {type(e).__name__}: {str(e)}")
        
        # If it's a Supabase Auth error, it's a 401
        if "auth" in str(e).lower() or "token" in str(e).lower() or "invalid" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Otherwise, it might be a database or network error (500)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Authentication Error: {type(e).__name__}"
        )

@router.get("/me", response_model=UserProfile)
def read_users_me(current_user: UserProfile = Depends(get_current_user)):
    return current_user