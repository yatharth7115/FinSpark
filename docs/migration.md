# Migration

Baseline: `Adwik1-2/FinSpark` commit `367e4a87b6d719bc75d6c32b3d33f35219940eff`.

The frontend was a Git link without a visible `.gitmodules` file. It was recovered from `Adwik1-2/FinSpark-Integration-Orchestrator` at the exact referenced commit, `98e4a4a10a24be7d40a20af461ace5e3ffaf1259`, and is now ordinary repository source.

| Earlier path | New path |
| --- | --- |
| `fastapi_backend/main.py` | `backend/app/main.py`, `backend/app/api/routes.py` |
| `engine.py`, `ai_mapper.py`, `requirement_analyzer.py` | `backend/app/services/` |
| `auth.py` | `backend/app/core/auth.py` |
| `auth_routes.py`, `schemas.py` | `backend/app/api/` |
| `database.py`, `models.py` | `backend/app/db/` |
| Frontend Git link | `frontend/` |
| Original UI | `frontend/src/legacy/` |
| Original system guide | `docs/legacy-system-guide.md` |

Imports and startup commands were updated. Original UI layouts remain available for reference, outside the new production bundle. Hardcoded admin credentials, admin seeding, the mock admin router and simulated Google sign-in have been removed. Legacy authentication is a disabled migration placeholder. Python bytecode, the tracked database and generated history are excluded from the new source tree and remain recoverable in the baseline commit. Git history was not rewritten. The new backend starts with clean data; review ownership/content before any old-data migration.

Guest mode is explicitly sample/local rather than a mock administrator. Server processing/history require bearer authentication. History is isolated by account; upload size, extension and readable text are validated. Logout invalidates its specific session, Pydantic models use version-2 validation, and CORS/storage paths are configurable. The mock admin router is not mounted.
