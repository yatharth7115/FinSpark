"""Integration checks for the moved backend and its trust boundaries."""

import os
import tempfile
from pathlib import Path
from datetime import datetime, timedelta
import pytest

test_dir = tempfile.TemporaryDirectory(prefix="finspark-tests-")
os.environ["DATA_DIR"] = test_dir.name
os.environ.pop("DATABASE_URL", None)
os.environ.pop("HF_TOKEN", None)

from fastapi.testclient import TestClient
from app.main import app
from app.db.database import SessionLocal, engine
from app.db.models import User, LoginSession
from app.core.auth import auth_service
from app.core.config import settings
from app.services.documents import history_name


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as client:
        with SessionLocal() as db:
            for index in range(2):
                user = User(
                    id=f"test-user-{index}",
                    email=f"test{index}@example.com",
                    full_name=f"Test User {index}",
                    hashed_password=auth_service.hash_password("ExamplePassword1!"),
                    is_verified=True,
                )
                db.add(user)
                db.add(
                    LoginSession(
                        user_id=user.id,
                        token=f"test-token-{index}",
                        expires_at=datetime.utcnow() + timedelta(hours=1),
                    )
                )
            db.commit()
        yield client
    engine.dispose()
    test_dir.cleanup()


def headers(index=0):
    return {"Authorization": f"Bearer test-token-{index}"}


def test_health_and_authentication(client):
    assert client.get("/health").json()["status"] == "healthy"
    assert (
        client.post(
            "/process/", files={"file": ("test.txt", b"PAN verification")}
        ).status_code
        == 401
    )
    assert client.get("/history/").status_code == 401
    assert (
        client.get("/api/auth/me", headers=headers()).json()["full_name"]
        == "Test User 0"
    )


def test_invalid_uploads(client):
    assert (
        client.post(
            "/process/", headers=headers(), files={"file": ("test.exe", b"bad")}
        ).status_code
        == 415
    )
    assert (
        client.post(
            "/process/", headers=headers(), files={"file": ("empty.txt", b" ")}
        ).status_code
        == 422
    )
    response = client.post(
        "/process/",
        headers=headers(),
        files={"file": ("big.txt", b"x" * (settings.max_upload_bytes + 1))},
    )
    assert response.status_code == 413


def test_document_mapping_simulation_and_private_history(client):
    text = "Customer verification: PAN and Aadhaar.\nLoan amount, bank account, IFSC code.\nSend an SMS notification."
    response = client.post(
        "/process/",
        headers=headers(),
        files={"file": ("../../loan.txt", text.encode())},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    analysis = result["intelligent_analysis"]
    assert analysis["apis_detected"] > 0
    assert any(api["api_id"] == "kyc-pro" for api in analysis["detected_apis"])
    simulation = client.post("/execute-pipeline/", headers=headers(), json=analysis)
    assert simulation.status_code == 200, simulation.text
    assert simulation.json()["execution_log"]
    assert client.get("/history/", headers=headers()).json()["total"] == 1
    assert client.get("/history/", headers=headers(1)).json()["total"] == 0
    assert "/" not in history_name("../../loan.txt")
    assert len(list(settings.history_dir.rglob("*_history.json"))) == 1


def test_password_login_and_session_logout(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "test1@example.com", "password": "ExamplePassword1!"},
    )
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    auth = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/auth/me", headers=auth).status_code == 200
    assert client.post("/api/auth/logout", headers=auth).status_code == 200
    assert client.get("/api/auth/me", headers=auth).status_code == 401
    assert client.get("/api/auth/me", headers=headers(1)).status_code == 200


def test_docx_and_unreadable_pdf(client):
    from io import BytesIO
    from docx import Document
    from PyPDF2 import PdfWriter

    document = Document()
    document.add_paragraph("Verify identity using PAN and Aadhaar.")
    data = BytesIO()
    document.save(data)
    response = client.post(
        "/process/",
        headers=headers(),
        files={"file": ("identity.docx", data.getvalue())},
    )
    assert response.status_code == 200, response.text
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    blank = BytesIO()
    writer.write(blank)
    response = client.post(
        "/process/", headers=headers(), files={"file": ("scan.pdf", blank.getvalue())}
    )
    assert response.status_code == 422


def test_signup_requires_email_code(client, monkeypatch):
    captured = {}

    def capture(email, code):
        captured[email] = code
        return True

    monkeypatch.setattr(auth_service, "send_otp_email", capture)
    monkeypatch.setattr(auth_service, "send_welcome_email", lambda *args: True)
    email = "signup@example.com"
    assert client.post("/api/auth/send-otp", json={"email": email}).status_code == 200
    payload = {
        "email": email,
        "full_name": "Signup Test",
        "password": "ExamplePassword1!",
        "otp": "wrong!",
    }
    assert client.post("/api/auth/signup-verify", json=payload).status_code == 400
    payload["otp"] = captured[email]
    response = client.post("/api/auth/signup-verify", json=payload)
    assert response.status_code == 200, response.text
    assert response.json()["user"]["full_name"] == "Signup Test"


def test_pipeline_ids_resolve_only_in_owner_history(client):
    pipeline = client.get("/pipelines/", headers=headers()).json()["pipelines"][0]
    path = "/pipeline/" + pipeline["id"]
    assert (
        client.get(path + "/details", headers=headers()).json()["name"]
        == pipeline["name"]
    )
    assert client.get(path + "/details", headers=headers(1)).json().get("error")
    assert client.delete(path, headers=headers()).json()["status"] == "success"


def test_disposable_demo_sessions_are_optional_and_isolated(client, monkeypatch):
    assert client.post("/api/auth/demo-session").status_code == 404
    monkeypatch.setattr(settings, "demo_mode", True)
    sessions = [client.post("/api/auth/demo-session").json() for _ in range(2)]
    assert sessions[0]["access_token"] != sessions[1]["access_token"]
    assert sessions[0]["user"]["id"] != sessions[1]["user"]["id"]
    auth = [{"Authorization": "Bearer " + item["access_token"]} for item in sessions]
    assert (
        client.post(
            "/process/",
            headers=auth[0],
            files={"file": ("demo.txt", b"Customer identity verification using PAN.")},
        ).status_code
        == 200
    )
    assert client.get("/history/", headers=auth[0]).json()["total"] == 1
    assert client.get("/history/", headers=auth[1]).json()["total"] == 0
