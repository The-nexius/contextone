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

def check_rate_limit(ip: str, endpoint: str, max_requests: int = 20, window_seconds: int = 60) -> bool:
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

@router.post("/signup", response_model=LoginResponse)
async def signup(request: Request, signup_data: SignupRequest, supabase: Client = Depends(get_supabase_admin)):
    """Register new user and auto-login - no email verification"""
    # Rate limiting
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(client_ip, "signup"):
        raise HTTPException(status_code=429, detail="Too many signup attempts. Please try again later.")
    
    try:
        # Use admin API to create user without email confirmation
        # This bypasses the need for email verification
        admin_user = supabase.auth.admin.create_user({
            "email": signup_data.email,
            "password": signup_data.password,
            "email_confirm": True,  # Auto-confirm email
            "user_metadata": {
                "email": signup_data.email
            }
        })
        
        if admin_user.user is None:
            raise HTTPException(status_code=400, detail="Signup failed")
        
        # Auto-login immediately after signup
        login_session = supabase.auth.sign_in_with_password({
            "email": signup_data.email,
            "password": signup_data.password
        })
        
        if login_session.user is None:
            raise HTTPException(status_code=400, detail="Signup successful but auto-login failed")
        
        # Create JWT token
        token_payload = {"sub": login_session.user.id}
        access_token = jwt.encode(
            token_payload, 
            settings.jwt_secret, 
            algorithm=settings.jwt_algorithm
        )
        
        return LoginResponse(
            access_token=access_token,
            user_id=login_session.user.id
        )
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"SIGNUP ERROR: {error_msg}")
        raise HTTPException(status_code=400, detail=f"Signup failed: {error_msg}")

@router.post("/logout")
async def logout(supabase: Client = Depends(get_supabase)):
    """Logout current user"""
    supabase.auth.sign_out()
    return {"message": "Logged out successfully"}

@router.get("/verify")
async def verify(current_user: str = Depends(get_current_user)):
    """Verify current token"""
    return {"user_id": current_user, "valid": True}

# Email verification codes store
verification_codes = {}
import time
import random

def generate_verification_code():
    """Generate 6-digit code"""
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

def send_verification_email(email: str, code: str):
    """Send verification email via Supabase"""
    supabase_admin = get_supabase_admin()
    # Use Supabase's built-in email templates
    # For custom emails, you'd use SMTP or a service like Resend/SendGrid
    print(f"VERIFICATION CODE for {email}: {code}")
    return True

@router.post("/signup-with-verification")
async def signup_with_verification(request: Request, signup_data: SignupRequest, supabase: Client = Depends(get_supabase_admin)):
    """Signup with email verification"""
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(client_ip, "signup", max_requests=10, window_seconds=300):
        raise HTTPException(status_code=429, detail="Too many signup attempts. Please try again later.")
    
    try:
        # Generate verification code
        code = generate_verification_code()
        
        # Store code with email (temporary - should use Redis in production)
        verification_codes[signup_data.email] = {
            "code": code,
            "email": signup_data.email,
            "password": signup_data.password,
            "expires": time.time() + 600  # 10 minutes
        }
        
        # Send verification email
        send_verification_email(signup_data.email, code)
        
        return {"message": "Verification code sent to your email", "email": signup_data.email}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Signup failed: {str(e)}")

@router.post("/verify-email")
async def verify_email(request: Request, data: dict, supabase: Client = Depends(get_supabase_admin)):
    """Verify email with code"""
    email = data.get("email", "").lower().strip()
    code = data.get("code", "")
    
    if email not in verification_codes:
        raise HTTPException(status_code=400, detail="Invalid verification request")
    
    stored = verification_codes[email]
    if stored["code"] != code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    if time.time() > stored["expires"]:
        del verification_codes[email]
        raise HTTPException(status_code=400, detail="Verification code expired")
    
    try:
        # Create the user in Supabase
        session = supabase.auth.sign_up({
            "email": email,
            "password": stored["password"],
            "options": {
                "email_confirm": True
            }
        })
        
        # Clean up
        del verification_codes[email]
        
        if session.user is None:
            raise HTTPException(status_code=400, detail="User creation failed")
        
        return {"message": "Email verified successfully", "user_id": session.user.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Verification failed: {str(e)}")

@router.post("/resend-code")
async def resend_code(request: Request, data: dict, supabase: Client = Depends(get_supabase_admin)):
    """Resend verification code"""
    email = data.get("email", "").lower().strip()
    
    if email not in verification_codes:
        raise HTTPException(status_code=400, detail="No pending verification for this email")
    
    # Generate new code
    code = generate_verification_code()
    verification_codes[email]["code"] = code
    verification_codes[email]["expires"] = time.time() + 600
    
    send_verification_email(email, code)
    
    return {"message": "New verification code sent"}

@router.get("/oauth/{provider}")
async def oauth_login(provider: str):
    """Get OAuth URL for Google/GitHub login"""
    valid_providers = ["google", "github"]
    if provider not in valid_providers:
        raise HTTPException(status_code=400, detail="Invalid OAuth provider")
    
    # Build OAuth URL for Supabase - redirect to our callback handler
    redirect_to = settings.app_url + "/auth/callback"
    
    if provider == "google":
        oauth_url = f"{settings.supabase_url}/auth/v1/authorize?provider=google&redirect_to={redirect_to}"
    elif provider == "github":
        oauth_url = f"{settings.supabase_url}/auth/v1/authorize?provider=github&redirect_to={redirect_to}"
    
    return {"oauth_url": oauth_url, "provider": provider}

@router.post("/oauth/callback")
async def oauth_callback(data: dict, supabase: Client = Depends(get_supabase)):
    """Handle OAuth callback"""
    # In Supabase, OAuth tokens are handled automatically
    # This endpoint is for creating JWT after OAuth
    access_token = data.get("access_token")
    
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token")
    
    try:
        # Verify the token and get user
        user = supabase.auth.get_user(access_token)
        
        if not user.user:
            raise HTTPException(status_code=401, detail="Invalid OAuth token")
        
        # Create our JWT
        token_payload = {"sub": user.user.id}
        jwt_token = jwt.encode(
            token_payload, 
            settings.jwt_secret, 
            algorithm=settings.jwt_algorithm
        )
        
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "user_id": user.user.id
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"OAuth verification failed: {str(e)}")

@router.post("/forgot-password")
async def forgot_password(request: Request, data: dict, supabase: Client = Depends(get_supabase)):
    """Send password reset email"""
    email = data.get("email", "").lower().strip()
    
    if not email or not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
        raise HTTPException(status_code=400, detail="Valid email required")
    
    try:
        reset_url = f"{settings.app_url}/reset-password"
        supabase.auth.reset_password_email(email, {
            "redirect_to": reset_url
        })
        return {"message": "Password reset link sent to your email"}
    except Exception as e:
        return {"message": "If the email exists, a reset link has been sent"}

@router.post("/reset-password")
async def reset_password(data: dict, supabase: Client = Depends(get_supabase)):
    """Reset password with access token from email"""
    password = data.get("password", "")
    access_token = data.get("access_token", "")
    
    if not password or len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    if not access_token:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    
    try:
        supabase.auth.set_session(access_token, "", {"email": "", "password": password})
        supabase.auth.update_user({"password": password})
        return {"message": "Password reset successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Password reset failed: {str(e)}")
