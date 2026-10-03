"""Document extraction and filesystem history, isolated from HTTP routes."""

import io
import json
import hashlib
import re
from contextvars import ContextVar
from datetime import datetime
from fastapi import UploadFile, HTTPException
from PyPDF2 import PdfReader
from docx import Document
from app.core.config import settings

history_user = ContextVar("history_user", default=None)


def history_directory():
    user_id = history_user.get()
    if user_id is None:
        raise RuntimeError("An authenticated history owner is required.")
    directory = settings.history_dir / hashlib.sha256(str(user_id).encode()).hexdigest()
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def history_name(filename: str) -> str:
    return hashlib.sha256(filename.encode()).hexdigest() + "_history.json"


def history_path(identifier: str):
    """Resolve opaque IDs returned by /pipelines/ or legacy document names."""
    name = (
        identifier + ".json"
        if re.fullmatch(r"[a-f0-9]{64}_history", identifier)
        else history_name(identifier)
    )
    return history_directory() / name


async def read_document(file: UploadFile):
    extension = (file.filename or "").rsplit(".", 1)[-1].lower()
    if extension not in {"pdf", "docx", "txt"}:
        raise HTTPException(415, "Choose a PDF, DOCX, or TXT document.")
    content = await file.read(settings.max_upload_bytes + 1)
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(413, "Documents must be 10 MB or smaller.")
    text = extract_text(file, content)
    if not text.strip():
        raise HTTPException(
            422,
            "No readable text found. Scanned PDFs require OCR and are not supported.",
        )
    return text


def extract_text(file: UploadFile, content: bytes):
    ext = file.filename.split(".")[-1].lower()

    if ext == "pdf" and PdfReader:
        try:
            reader = PdfReader(io.BytesIO(content))
            return "\n".join([p.extract_text() or "" for p in reader.pages])
        except Exception as e:
            print(f"PDF extraction error: {e}")
            return ""

    elif ext == "docx" and Document:
        try:
            doc = Document(io.BytesIO(content))
            return "\n".join([p.text for p in doc.paragraphs])
        except Exception as e:
            print(f"DOCX extraction error: {e}")
            return ""

    else:
        return content.decode("utf-8", errors="ignore")


# ============================================================
# PIPELINE HISTORY MANAGEMENT
# ============================================================


def save_pipeline_history(filename: str, pipeline_data: dict):
    """Save pipeline result to history"""
    history_file = history_directory() / history_name(filename)

    try:
        # Load existing history
        if history_file.exists():
            with open(history_file, "r") as f:
                history = json.load(f)
        else:
            history = {"pipeline_name": filename, "runs": []}

        # Add new run
        history["runs"].append(
            {
                "timestamp": datetime.now().isoformat(),
                "data": pipeline_data,
                "status": "completed",
            }
        )

        # Save updated history
        with open(history_file, "w") as f:
            json.dump(history, f, indent=2)

        return True
    except Exception as e:
        print(f"Error saving history: {e}")
        return False


def get_pipeline_history(filename: str):
    """Retrieve pipeline history"""
    history_file = history_path(filename)

    try:
        if history_file.exists():
            with open(history_file, "r") as f:
                return json.load(f)
        else:
            return {"pipeline_name": filename, "runs": []}
    except Exception as e:
        print(f"Error reading history: {e}")
        return {"pipeline_name": filename, "runs": [], "error": str(e)}
