"""
Authentication endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from jose import jwt, JWTError
from supabase import create_client, Client
from app.config import settings

router = APIRouter()
security = HTTPBearer()

# Initialize Supabase client
def get_supabase() -> Client:
    return create_client(settings.supabase_url, settings.supabase_anon_key)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and return user_id"""
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token, 
            settings.jwt_secret, 
            algorithms=[settings.jwt_algorithm]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str

class SignupRequest(BaseModel):
    email: str
    password: str

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, supabase: Client = Depends(get_supabase)):
    """Login with email and password"""
    try:
        session = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if session.user is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create JWT token
        token_payload = {"sub": session.user.id}
        access_token = jwt.encode(
            token_payload, 
            settings.jwt_secret, 
            algorithm=settings.jwt_algorithm
        )
        
        return LoginResponse(
            access_token=access_token,
            user_id=session.user.id
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.post("/signup")
async def signup(request: SignupRequest, supabase: Client = Depends(get_supabase)):
    """Register new user"""
    try:
        session = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password
        })
        
        if session.user is None:
            raise HTTPException(status_code=400, detail="Signup failed")
        
        return {"message": "User created successfully", "user_id": session.user.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/logout")
async def logout(supabase: Client = Depends(get_supabase)):
    """Logout current user"""
    supabase.auth.sign_out()
    return {"message": "Logged out successfully"}

@router.get("/verify")
async def verify(current_user: str = Depends(get_current_user)):
    """Verify current token"""
    return {"user_id": current_user, "valid": True}