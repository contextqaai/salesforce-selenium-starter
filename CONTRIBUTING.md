# Contributing

Open an issue describing the business rule, synthetic example and expected outcome. Never include customer data, secrets, signed artifacts or proprietary test assets.

For a patch: run `npm ci`, install the browser prerequisites, `npm test` and `npm run test:mutations`. Include a deliberate failing case for a new business rule. Keep dependencies locked, selectors readable and cleanup scoped to run-owned data. Update `scenarios.json` and documentation. Contributions are under the repository license; brand artwork is excluded from reuse as your own identity.
