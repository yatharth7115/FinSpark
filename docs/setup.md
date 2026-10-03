# Setup

Use Node.js 22, npm and Python 3.12. The frontend lockfile is committed.

## Frontend

```sh
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5176`. The fictional sample uses deterministic keyword matching. Upload TXT documents with one requirement per line. Browse the registry, inspect mappings, simulate and export plans. Session history is held in memory and clears on reload.

Copy `frontend/.env.example` to `.env` and set `VITE_API_BASE_URL` for a default service address, or enter the address in Settings. Only that address is saved in local storage. Authentication tokens use session storage.

## Backend

Create and activate a virtual environment, install `backend/requirements.txt`, then run from `backend`:

```sh
python -X utf8 -m uvicorn app.main:app --port 8001
```

UTF-8 mode supports the recovered engine's Unicode messages on Windows.

Copy `backend/.env.example` to `.env` if needed. Blank database and data path settings use defaults.

| Variable | Purpose |
| --- | --- |
| `ALLOWED_ORIGINS` | Comma-separated frontend origins |
| `DATA_DIR` | Persistent storage directory; default `backend/data` |
| `DATABASE_URL` | SQLAlchemy URL; default SQLite in `DATA_DIR` |
| `HF_TOKEN` | Optional external Hugging Face inference |
| `SENDER_EMAIL`, `SENDER_PASSWORD` | SMTP verification email credentials |
| `SMTP_SERVER`, `SMTP_PORT` | SMTP host and port |

Account creation needs SMTP. No default account or password is supplied. Sign in with a verified account to enable server processing.

`GET /health` is public. Processing/history require `Authorization: Bearer <session-token>`. Uploads accept PDF, DOCX and TXT, up to 10 MB. Scanned PDFs without text require OCR and are rejected.

## Tests

Run `npm run build` from `frontend`. From `backend`, install `requirements-dev.txt` and run `python -X utf8 -m pytest -q`. Tests use fictional users and temporary storage. They do not contact banks or send email.
