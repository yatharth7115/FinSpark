from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import secrets
from app.db.models import User, OTPVerification, LoginSession
from app.api.schemas import (
    SignupRequest,
    LoginRequest,
    SendOTPRequest,
    VerifyOTPRequest,
    VerifyOTPWithPasswordRequest,
    UserResponse,
    LoginResponse,
    OTPResponse,
    VerificationResponse,
    ErrorResponse,
)
from app.db.database import get_db
from app.core.auth import auth_service
from app.core.config import settings

router = APIRouter(prefix="/api/auth", tags=["authentication"])

bearer = HTTPBearer(auto_error=False)


@router.post("/demo-session", response_model=LoginResponse)
def create_demo_session(db: Session = Depends(get_db)):
    """Create a separate, short-lived identity for a disposable hosted demo."""
    if not settings.demo_mode:
        raise HTTPException(404, "Demo sessions are disabled.")
    if db.query(User).filter(User.verification_method == "demo").count() >= 1000:
        raise HTTPException(
            503, "Demo capacity reached. Please use local TXT analysis."
        )
    identifier = secrets.token_hex(16)
    user = User(
        id=identifier,
        email=f"demo-{identifier}@example.com",
        full_name="Demo session",
        hashed_password=auth_service.hash_password(secrets.token_urlsafe(32)),
        is_verified=True,
        verification_method="demo",
    )
    access_token = secrets.token_urlsafe(32)
    db.add(user)
    db.add(
        LoginSession(
            user_id=identifier,
            token=access_token,
            expires_at=datetime.utcnow() + timedelta(hours=2),
        )
    )
    db.commit()
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user),
    }


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials if credentials else None
    """Get current authenticated user from token"""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    session = (
        db.query(LoginSession)
        .filter(
            LoginSession.token == token,
            LoginSession.is_active == True,
            LoginSession.expires_at > datetime.utcnow(),
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        )

    user = db.query(User).filter(User.id == session.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    return user


@router.post("/send-otp", response_model=OTPResponse)
async def send_otp(request: SendOTPRequest, db: Session = Depends(get_db)):
    """Send OTP to email"""
    try:
        # Validate email
        if not auth_service.validate_email(request.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email format"
            )

        # Check if user exists and is verified
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user and existing_user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists and is verified",
            )

        # Generate OTP
        otp_code = auth_service.generate_otp()

        # Delete previous OTPs for this email
        db.query(OTPVerification).filter(
            OTPVerification.email == request.email, OTPVerification.is_used == False
        ).delete()
        db.commit()

        # Save OTP to database
        otp_verification = OTPVerification(
            email=request.email,
            otp_code=otp_code,
            expires_at=datetime.utcnow() + timedelta(minutes=10),
        )
        db.add(otp_verification)
        db.commit()

        # Send OTP via email
        email_sent = auth_service.send_otp_email(request.email, otp_code)

        if not email_sent:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send OTP email",
            )

        return {"success": True, "message": f"OTP sent successfully to {request.email}"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending OTP: {str(e)}",
        )


@router.post("/verify-otp", response_model=VerificationResponse)
async def verify_otp_only(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify OTP for existing users (login flow)"""
    try:
        # Find the latest OTP for this email
        otp_verification = (
            db.query(OTPVerification)
            .filter(
                OTPVerification.email == request.email, OTPVerification.is_used == False
            )
            .order_by(OTPVerification.created_at.desc())
            .first()
        )

        if not otp_verification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No OTP found. Please request a new OTP",
            )

        # Check if OTP is valid
        if not otp_verification.is_valid():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP has expired or too many attempts. Request a new OTP",
            )

        # Verify OTP code
        if otp_verification.otp_code != request.otp:
            otp_verification.attempt_count += 1
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP code"
            )

        # Mark OTP as used
        otp_verification.is_used = True
        otp_verification.verified_at = datetime.utcnow()
        db.commit()

        # Find or create user
        user = db.query(User).filter(User.email == request.email).first()
        if not user:
            # For login, user must exist
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found. Please signup first",
            )

        # Update user verification status
        user.is_verified = True
        user.verification_method = "email"
        user.last_login = datetime.utcnow()
        db.commit()

        # Create login session
        access_token = secrets.token_urlsafe(32)
        session = LoginSession(
            user_id=user.id,
            token=access_token,
            expires_at=datetime.utcnow() + timedelta(days=7),
        )
        db.add(session)
        db.commit()

        return {
            "success": True,
            "message": "Email verified successfully",
            "access_token": access_token,
            "user": UserResponse.model_validate(user),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifying OTP: {str(e)}",
        )


@router.post("/signup-verify", response_model=VerificationResponse)
async def signup_with_otp_verification(
    request: VerifyOTPWithPasswordRequest, db: Session = Depends(get_db)
):
    """Verify OTP and create user account (signup flow)"""
    try:
        # Validate email
        if not auth_service.validate_email(request.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email format"
            )

        # Validate password
        is_valid, message = auth_service.validate_password(request.password)
        if not is_valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

        # Find the latest OTP for this email
        otp_verification = (
            db.query(OTPVerification)
            .filter(
                OTPVerification.email == request.email, OTPVerification.is_used == False
            )
            .order_by(OTPVerification.created_at.desc())
            .first()
        )

        if not otp_verification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No OTP found. Please request a new OTP",
            )

        # Check if OTP is valid
        if not otp_verification.is_valid():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP has expired or too many attempts. Request a new OTP",
            )

        # Verify OTP code
        if otp_verification.otp_code != request.otp:
            otp_verification.attempt_count += 1
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP code"
            )

        # Check if user already exists
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists",
            )

        # Create new user
        new_user = User(
            email=request.email,
            full_name=request.full_name,
            hashed_password=auth_service.hash_password(request.password),
            is_verified=True,
            verification_method="email",
            is_active=True,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Mark OTP as used
        otp_verification.is_used = True
        otp_verification.verified_at = datetime.utcnow()
        db.commit()

        # Send welcome email
        auth_service.send_welcome_email(request.email, request.full_name)

        # Create login session
        access_token = secrets.token_urlsafe(32)
        session = LoginSession(
            user_id=new_user.id,
            token=access_token,
            expires_at=datetime.utcnow() + timedelta(days=7),
        )
        db.add(session)
        db.commit()

        return {
            "success": True,
            "message": "Account created and verified successfully",
            "access_token": access_token,
            "user": UserResponse.model_validate(new_user),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in signup verification: {str(e)}",
        )


@router.post("/login", response_model=LoginResponse)
async def login_with_password(request: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password"""
    try:
        # Find user by email
        user = db.query(User).filter(User.email == request.email).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive"
            )

        # Verify password
        password_valid = auth_service.verify_password(
            request.password, user.hashed_password
        )

        if not user.hashed_password or not password_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()

        # Create login session
        access_token = secrets.token_urlsafe(32)
        session = LoginSession(
            user_id=user.id,
            token=access_token,
            expires_at=datetime.utcnow() + timedelta(days=7),
        )
        db.add(session)
        db.commit()

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserResponse.model_validate(user),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during login: {str(e)}",
        )


@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse.model_validate(current_user)


@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Logout (invalidate session)"""
    try:
        if credentials:
            token = credentials.credentials
            session = db.query(LoginSession).filter(LoginSession.token == token).first()
            if session:
                session.is_active = False
                db.commit()

        return {"success": True, "message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during logout: {str(e)}",
        )


@router.post("/refresh-token")
async def refresh_token(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Refresh access token"""
    try:
        access_token = secrets.token_urlsafe(32)
        session = LoginSession(
            user_id=current_user.id,
            token=access_token,
            expires_at=datetime.utcnow() + timedelta(days=7),
        )
        db.add(session)
        db.commit()

        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error refreshing token: {str(e)}",
        )
