"""
Authentication endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, validator
from typing import Optional
from jose import jwt, JWTError
from supabase import create_client, Client
from app.config import settings
import re

router = APIRouter()
security = HTTPBearer()

# Simple in-memory rate limiting (for production, use Redis)
rate_limit_store = {}

def check_rate_limit(ip: str, endpoint: str, max_requests: int = 5, window_seconds: int = 60) -> bool:
    """Simple rate limiting check"""
    import time
    key = f"{ip}:{endpoint}"
    now = time.time()
    
    if key not in rate_limit_store:
        rate_limit_store[key] = []
    
    # Remove old requests outside the window
    rate_limit_store[key] = [t for t in rate_limit_store[key] if now - t < window_seconds]
    
    if len(rate_limit_store[key]) >= max_requests:
        return False
    
    rate_limit_store[key].append(now)
    return True

# Initialize Supabase client
def get_supabase() -> Client:
    return create_client(settings.supabase_url, settings.supabase_anon_key)

# Admin client for privileged operations
def get_supabase_admin() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_key)

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
    
    @validator('email')
    def validate_email(cls, v):
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', v):
            raise ValueError('Invalid email format')
        return v.lower().strip()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str

class SignupRequest(BaseModel):
    email: str
    password: str
    
    @validator('email')
    def validate_email(cls, v):
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', v):
            raise ValueError('Invalid email format')
        return v.lower().strip()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        if len(v) > 128:
            raise ValueError('Password must be less than 128 characters')
        return v

@router.post("/login", response_model=LoginResponse)
async def login(request: Request, login_data: LoginRequest, supabase: Client = Depends(get_supabase)):
    """Login with email and password"""
    # Rate limiting
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(client_ip, "login"):
        raise HTTPException(status_code=429, detail="Too many login attempts. Please try again later.")
    
    try:
        session = supabase.auth.sign_in_with_password({
            "email": login_data.email,
            "password": login_data.password
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/signup")
async def signup(request: Request, signup_data: SignupRequest, supabase: Client = Depends(get_supabase_admin)):
    """Register new user"""
    # Rate limiting
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(client_ip, "signup"):
        raise HTTPException(status_code=429, detail="Too many signup attempts. Please try again later.")
    
    try:
        session = supabase.auth.sign_up({
            "email": signup_data.email,
            "password": signup_data.password,
            "options": {
                "email_confirm": False
            }
        })
        
        if session.user is None:
            raise HTTPException(status_code=400, detail="Signup failed")
        
        return {"message": "User created successfully", "user_id": session.user.id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail="Signup failed. Email may already be in use.")

@router.post("/logout")
async def logout(supabase: Client = Depends(get_supabase)):
    """Logout current user"""
    supabase.auth.sign_out()
    return {"message": "Logged out successfully"}

@router.get("/verify")
async def verify(current_user: str = Depends(get_current_user)):
    """Verify current token"""
    return {"user_id": current_user, "valid": True}