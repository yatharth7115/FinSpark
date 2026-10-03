import secrets
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Optional, Tuple
from dotenv import load_dotenv
import re
import bcrypt

load_dotenv()


class AuthService:
    """Authentication service for OTP, email, and password management"""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode(), salt).decode()

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        try:
            return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())
        except Exception as e:
            print(f"Password verification error: {e}")
            return False

    @staticmethod
    def generate_otp(length: int = 6) -> str:
        """Generate a random OTP"""
        return "".join(secrets.choice("0123456789") for _ in range(length))

    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return re.match(pattern, email) is not None

    @staticmethod
    def validate_password(password: str) -> Tuple[bool, str]:
        """Validate password strength"""
        if len(password) < 8:
            return False, "Password must be at least 8 characters long"

        if not re.search(r"[A-Z]", password):
            return False, "Password must contain at least one uppercase letter"

        if not re.search(r"[a-z]", password):
            return False, "Password must contain at least one lowercase letter"

        if not re.search(r"[0-9]", password):
            return False, "Password must contain at least one number"

        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False, "Password must contain at least one special character"

        return True, "Password is valid"

    @staticmethod
    def send_otp_email(to_email: str, otp: str, user_name: str = "User") -> bool:
        """Send OTP via email"""
        try:
            # Email configuration
            sender_email = os.getenv("SENDER_EMAIL", "your-email@gmail.com")
            sender_password = os.getenv("SENDER_PASSWORD", "your-app-password")
            smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
            smtp_port = int(os.getenv("SMTP_PORT", "587"))

            # Create email message
            message = MIMEMultipart("alternative")
            message["Subject"] = "FinSpark - Email Verification OTP"
            message["From"] = sender_email
            message["To"] = to_email

            # Email body HTML
            html = f"""\
            <html>
              <body>
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background-color: #1e40af; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">FinSpark</h1>
                  </div>
                  <div style="background-color: #f3f4f6; padding: 40px; text-align: center;">
                    <h2 style="color: #1f2937; margin-top: 0;">Email Verification</h2>
                    <p style="color: #666; font-size: 16px;">Hi {user_name},</p>
                    <p style="color: #666; font-size: 14px;">Your verification code is:</p>
                    <div style="background-color: white; padding: 30px; border-radius: 8px; margin: 20px 0;">
                      <h1 style="color: #1e40af; letter-spacing: 5px; margin: 0;">{otp}</h1>
                    </div>
                    <p style="color: #666; font-size: 12px;">This code expires in 10 minutes.</p>
                    <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
                  </div>
                  <div style="background-color: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="color: white; margin: 0; font-size: 12px;">© 2026 FinSpark. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
            """

            part = MIMEText(html, "html")
            message.attach(part)

            # Send email
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(sender_email, sender_password)
                server.sendmail(sender_email, to_email, message.as_string())

            print(f"✓ OTP sent successfully to {to_email}")
            return True

        except Exception as e:
            print(f"✗ Failed to send OTP email: {str(e)}")
            return False

    @staticmethod
    def send_welcome_email(to_email: str, user_name: str = "User") -> bool:
        """Send welcome email after successful verification"""
        try:
            sender_email = os.getenv("SENDER_EMAIL", "your-email@gmail.com")
            sender_password = os.getenv("SENDER_PASSWORD", "your-app-password")
            smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
            smtp_port = int(os.getenv("SMTP_PORT", "587"))

            message = MIMEMultipart("alternative")
            message["Subject"] = "Welcome to FinSpark!"
            message["From"] = sender_email
            message["To"] = to_email

            html = f"""\
            <html>
              <body>
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background-color: #1e40af; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">FinSpark</h1>
                  </div>
                  <div style="background-color: #f3f4f6; padding: 40px; text-align: center;">
                    <h2 style="color: #1f2937;">Welcome, {user_name}!</h2>
                    <p style="color: #666; font-size: 14px;">Your account has been successfully verified.</p>
                    <p style="color: #666; font-size: 14px;">You can now access all features of FinSpark.</p>
                    <a href="http://localhost:5173" style="background-color: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px;">Go to FinSpark</a>
                  </div>
                  <div style="background-color: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="color: white; margin: 0; font-size: 12px;">© 2026 FinSpark. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
            """

            part = MIMEText(html, "html")
            message.attach(part)

            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(sender_email, sender_password)
                server.sendmail(sender_email, to_email, message.as_string())

            return True

        except Exception as e:
            print(f"✗ Failed to send welcome email: {str(e)}")
            return False


# Initialize auth service
auth_service = AuthService()
