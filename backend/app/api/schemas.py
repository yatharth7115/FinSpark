from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# Authentication Schemas
class SignupRequest(BaseModel):
    """Signup request schema"""

    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=8)

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "full_name": "John Doe",
                "password": "SecurePass123!",
            }
        }


class LoginRequest(BaseModel):
    """Login request schema"""

    email: EmailStr
    password: str

    class Config:
        json_schema_extra = {
            "example": {"email": "user@example.com", "password": "SecurePass123!"}
        }


class SendOTPRequest(BaseModel):
    """Send OTP request schema"""

    email: EmailStr

    class Config:
        json_schema_extra = {"example": {"email": "user@example.com"}}


class VerifyOTPRequest(BaseModel):
    """Verify OTP request schema"""

    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)

    class Config:
        json_schema_extra = {"example": {"email": "user@example.com", "otp": "123456"}}


class VerifyOTPWithPasswordRequest(BaseModel):
    """Verify OTP with password for signup"""

    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    full_name: str
    password: str

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "otp": "123456",
                "full_name": "John Doe",
                "password": "SecurePass123!",
            }
        }


class UserResponse(BaseModel):
    """User response schema"""

    id: str
    email: str
    full_name: Optional[str]
    is_verified: bool
    verification_method: Optional[str]
    profile_picture: Optional[str]
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Login response schema"""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": "uuid",
                    "email": "user@example.com",
                    "full_name": "John Doe",
                    "is_verified": True,
                    "verification_method": "email",
                    "profile_picture": None,
                    "created_at": "2024-01-01T00:00:00",
                    "last_login": "2024-01-01T00:00:00",
                },
            }
        }


class OTPResponse(BaseModel):
    """OTP sent response"""

    success: bool
    message: str

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "OTP sent successfully to your email",
            }
        }


class VerificationResponse(BaseModel):
    """Verification response"""

    success: bool
    message: str
    access_token: Optional[str] = None
    user: Optional[UserResponse] = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Email verified successfully",
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "user": {
                    "id": "uuid",
                    "email": "user@example.com",
                    "full_name": "John Doe",
                    "is_verified": True,
                    "verification_method": "email",
                    "profile_picture": None,
                    "created_at": "2024-01-01T00:00:00",
                    "last_login": None,
                },
            }
        }


class ErrorResponse(BaseModel):
    """Error response"""

    success: bool = False
    message: str
    error_code: Optional[str] = None
