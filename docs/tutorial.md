# Verify a business outcome

1. Run the installation and baseline commands in the README. The runner starts and stops the demo automatically.
2. Inspect `tests/scenarios.mjs`. The sales scenario checks linked identities; the service scenario checks saved resolution; the routing scenario checks values on both sides of the threshold.
3. Run `npm run demo`, open http://127.0.0.1:4173, choose Support and start an isolated session. Close without evidence: the case must stay Open. Add evidence and close: it must become Closed with that evidence retained. Stop the server with Ctrl-C before automated tests.
4. Run `npm run test:mutations`. Three intentionally broken policies must be detected. Read `artifacts/mutations.json`. This exercises assertion sensitivity; it does not establish that all possible defects are detected.
5. Restore normal behavior by running `npm test` without `DEMO_FAULT`. No code edits are needed to remove a fault.
6. Use the adaptation worksheet for a real org. Do not simply replace the URL: authentication, fields, selectors and semantics differ.

## Interpreting results

A scenario is successful only if the expected action/rejection AND independent saved-state checks complete. Rejected actions compare the full synthetic state with its baseline. Unexpected timeouts are errors, not successful rejections. Each framework uses a real headless browser, not mocked browser responses. Readback uses the demo HTTP API, so it is independent of rendered text, but not an independent database audit.

The test data is synthetic and in memory. Restarting the app removes all data. Each test deletes only its own session; cleanup is checked by a subsequent unauthorized state read.

Playwright records failure screenshots/traces and an HTML report. Selenium records failure screenshots and uses Node's test reporter. CI retains reports for seven days. Review artifacts before sharing when adapting to customer applications.
