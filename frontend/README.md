# FinSpark frontend

React and TypeScript workspace for tracing document requirements to financial API adapters.

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5176
npm run build
npm run format:check
```

The sample and local TXT analysis work without a server. PDF/DOCX processing and accounts require the FastAPI service described in [setup](../docs/setup.md). Settings lets you connect that service. Simulations use example responses.

Active code lives in `src/App.tsx`, `src/lib/` and `src/components/FinanceCursor.tsx`. The recovered original interface is preserved in `src/legacy/` for reference and migration.

The custom chart cursor and pointer glow run only with a fine pointer and when reduced motion is disabled. Touch and text-entry controls use the native cursor.
