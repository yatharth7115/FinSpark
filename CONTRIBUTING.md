# Contributing

Keep changes focused and open a pull request against `main`. Use the committed npm lockfile and run the frontend build. Check keyboard controls and phone layout after UI changes.

Backend routes belong in `app/api`, document logic in `app/services`, configuration/authentication helpers in `app/core`, and persistence in `app/db`. Use absolute package imports, four-space indentation and readable functions. Run the backend integration tests after changes.

Do not commit environments, tokens, databases, personal documents, generated history or Python bytecode. Add fictional samples in `examples` and keep setup commands synchronized. Simulated integrations must stay clearly labelled.
