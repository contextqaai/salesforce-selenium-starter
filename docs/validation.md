# Validation

Local verification: November 14, 2026 (America/Chicago), macOS arm64, Node 24.19.0.

- `npm test`: 12 passed, 0 failed, 0 skipped using a real headless browser.
- `npm run test:mutations`: all three deliberate defects detected by assertions.
- Clean baseline rerun after faults: 12 passed.
- Each test deletes its own demo session and verifies a 401 on subsequent state read.
- `npm install` audit reported no known vulnerabilities at verification time.

See [machine-readable receipt](validation.json) for source hashes and mutation verdicts. The local fixture is a live HTTP server with in-memory state; browser responses are not intercepted or mocked. Rules and data are synthetic.

## Independent clean-runner verification

The repository's GitHub Actions workflow installs locked dependencies, runs the baseline, detects three defects, and reruns the clean baseline. Check the actual workflow run and commit before treating CI as passed. Logs and failure artifacts remain separate from these local receipts.

## Limits

No Salesforce org was accessed. Native Salesforce authentication, Lightning selectors, Flows, sharing and product-specific configuration are not implemented or tested here. No cross-browser, mobile, load, accessibility or security certification is claimed. The browser matrix is Chromium for Playwright and Chrome for Selenium. In-memory demo API readback proves the synthetic state only.

No customer screenshots, credentials or schema appear in this release. Brand artwork is copied unchanged from the supplied canonical asset.
