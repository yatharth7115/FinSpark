"""Environment configuration with stable, deployment-safe data paths."""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class Settings:
    data_dir = Path(
        os.getenv("DATA_DIR") or str(Path(__file__).resolve().parents[2] / "data")
    ).resolve()
    history_dir = data_dir / "pipeline_history"
    database_url = (
        os.getenv("DATABASE_URL")
        or f"sqlite:///{(data_dir / 'finspark.db').as_posix()}"
    )
    allowed_origins = [
        x.strip()
        for x in os.getenv(
            "ALLOWED_ORIGINS", "http://localhost:5176,http://127.0.0.1:5176"
        ).split(",")
        if x.strip()
    ]
    max_upload_bytes = 10 * 1024 * 1024
    demo_mode = os.getenv("FINSPARK_DEMO_MODE", "false").lower() == "true"


settings = Settings()
settings.data_dir.mkdir(parents=True, exist_ok=True)
settings.history_dir.mkdir(parents=True, exist_ok=True)
