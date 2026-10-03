from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text
from datetime import datetime, timedelta
from app.db.database import Base
import uuid


class User(Base):
    """User database model"""

    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=True)  # Nullable for OAuth users
    is_verified = Column(Boolean, default=False)
    verification_method = Column(String(50))  # "email", "google"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    google_id = Column(String(255), unique=True, nullable=True)  # For Google OAuth
    profile_picture = Column(String(500), nullable=True)

    def __repr__(self):
        return (
            f"<User(id={self.id}, email={self.email}, is_verified={self.is_verified})>"
        )


class OTPVerification(Base):
    """OTP verification database model"""

    __tablename__ = "otp_verifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), nullable=False, index=True)
    otp_code = Column(String(6), nullable=False)
    is_used = Column(Boolean, default=False)
    attempt_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(
        DateTime, default=lambda: datetime.utcnow() + timedelta(minutes=10)
    )
    verified_at = Column(DateTime, nullable=True)

    def is_expired(self):
        """Check if OTP has expired"""
        return datetime.utcnow() > self.expires_at

    def is_valid(self):
        """Check if OTP is valid"""
        return not self.is_used and not self.is_expired() and self.attempt_count < 5

    def __repr__(self):
        return f"<OTPVerification(email={self.email}, is_used={self.is_used}, is_expired={self.is_expired()})>"


class LoginSession(Base):
    """Login session tracking"""

    __tablename__ = "login_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    token = Column(String(500), nullable=False, unique=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=7))
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)

    def is_expired(self):
        """Check if session has expired"""
        return datetime.utcnow() > self.expires_at

    def __repr__(self):
        return f"<LoginSession(user_id={self.user_id}, is_active={self.is_active})>"
