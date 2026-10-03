# Architecture and data handling

The React application provides an integration desk, adapter registry, session history, service settings and account access. Source requirements, suggestions and evidence are linked by selection. Browser keyword analysis is labelled separately from backend results.

`src/lib/workbench.ts` owns adapter definitions and deterministic local analysis; `src/lib/api.ts` handles authenticated HTTP requests. `src/App.tsx` composes the views. `FinanceCursor.tsx` adds a branded pointer for fine-pointer devices; reduced motion and touch use native controls.

`backend/app/main.py` composes FastAPI, CORS and routers. Original parsing and mapping behavior lives in `app/services`; file validation, extraction and history are isolated in `documents.py`. Configuration/authentication helpers and SQLAlchemy models have dedicated packages.

## Data boundaries

- Sample: fictional source and keyword suggestions; no credentials.
- Local TXT: document text stays in browser memory for this session.
- Connected processing: documents are sent to the configured service and parsed results are stored in server history.
- History: each authenticated account gets a separate hashed directory; filenames are hashed to avoid creating paths from upload names.
- Accounts: password hashes and sessions reside in the database. Logout invalidates the current session.
- Simulation: no financial, identity or messaging provider is contacted.

Without `HF_TOKEN`, the Python engine uses its existing keyword fallback. When enabled, external inference may send document-derived text to Hugging Face. Only enable it for documents approved for that processing destination. The external inference path was not exercised during this redesign.

The mock admin router is not mounted. Legacy placeholder endpoints are authenticated and marked deprecated. The prototype still needs request rate limits, a retention policy, dependency upgrades and an external-provider review before real customer-data use.
