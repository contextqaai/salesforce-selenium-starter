# Adapt to a real Salesforce org

This release ships no runnable native Salesforce adapter. Demo selectors and fictional roles are not substitutes for org-specific implementation. The mapping example is a worksheet, not executable runtime configuration.

## Capture the contract first

Record owner-approved rule/version, applicable object and record type, actual field API names, role permissions, status values, exceptions and external effects. Confirm the exact org/environment; Developer Edition does not mean sandbox. Record the selected products: standard Quote, managed-package CPQ, Revenue Cloud and custom simulation are distinct.

## Implement a separate adapter

Keep the scenario intent; replace the demo's `start`, `fill`, `click` and `state` helpers with supported authentication, reviewed UI locators and authorized API readback. The current scenarios compare synthetic response shapes, so map real records explicitly and review every assertion. Do not port the demo's role picker or session endpoint into a real login flow.

- Use customer-authorized identities for each persona. Keep tokens and browser storage state in ignored secret locations, never fixtures or Git.
- Do not automatically initiate Google SSO. Respect MFA, consent and authentication controls.
- Create run-owned synthetic records only in an approved environment. Review notifications, Flows, integrations and permitted cleanup before writes.
- Assert exact converted record relationships and configured statuses; do not rely only on a toast or 200 response.
- Negative tests need the expected rejection and unchanged protected state. Authorization failures before the intended action are not business-policy passes.
- Reuse only relevant actions; confirm each customer mapping and prerequisite before execution.
- Record case revision, org, role, rule version, result timestamp, assertions and media review status. Keep customer results private.

## Publication gate

A new adapter moves through specification → demo-tested → reference-org-tested → customer-adapted → customer-verified. Release a native-product claim only with the corresponding reviewed execution. Never inflate template counts into completed coverage or reuse one customer's evidence for another.

Read [ContextQA's case-closure exercise](https://learning.contextqa.com/packaged-application-testing/salesforce-testing/context-to-case-closure-evidence) and [Salesforce learning hub](https://learning.contextqa.com/packaged-application-testing/salesforce-testing).
