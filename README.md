# ContextQA Salesforce Selenium Starter

Free, MIT-licensed business-workflow test examples for teams learning to build Salesforce coverage. Run **12 browser scenarios** against the included synthetic application with no account or Salesforce credentials.

**Default browser suite scope:** the bundled local simulation. These browser tests do not connect to Salesforce and are not native Sales Cloud, Service Cloud or Flow certification. Fictional policy and stable demo selectors are intentionally explicit. See [validation](docs/validation.md) for actual run evidence and [adaptation](docs/adapting-to-salesforce.md) before using any pattern in your org.

An optional [native API companion](docs/native-api-companion.md) adds three real Salesforce API checks verified in one approved test org. It is separate from the browser suite.

## Run it

Requires Node.js 22+ and npm. Install Google Chrome first. Selenium Manager downloads a compatible driver, so the first run needs network access.

```sh
git clone https://github.com/contextqaai/salesforce-selenium-starter.git
cd salesforce-selenium-starter
npm ci
# Install Google Chrome; Selenium Manager resolves its driver on first run.
npm test
npm run test:mutations
```

Each test starts a fresh browser session and isolated synthetic records, then deletes its session. Ports 4174 must be free. No Salesforce account, Google SSO, cloud execution purchase or ContextQA subscription is required. Dependencies and browsers may need network access during installation; the tests themselves target loopback only.

## What you get

| Pack | Scenarios | Evidence checked |
| --- | --- | --- |
| Sales workflow | Valid conversion, missing company, duplicate conversion, restricted role | Linked account/contact/opportunity identities and unchanged state after rejection |
| Service workflow | Valid closure, missing evidence, restricted role | Case identity, final status, resolution and unchanged state after rejection |
| Permissions and Flow policy | Below/equal/above threshold, invalid score, restricted role | Queue, protected state and audit events |

The “Flow policy” is a Node.js simulation of a fictional routing rule, not Salesforce Flow Builder execution. Twelve scenarios are shared across the two framework editions; they are not 24 unique business scenarios.

## Learn by breaking it

`npm run test:mutations` introduces three defects, one at a time: accepting closure without evidence, allowing restricted writes, and moving the routing equality boundary. It succeeds only when each selected browser scenario fails with an assertion. It does not accept a browser startup error as successful defect detection.

Mutation runs intentionally produce failed test artifacts. Run `npm test` afterwards for a clean baseline. Do not set `DEMO_FAULT` during normal use. The demo supports only documented fault names.

- [Step-by-step tutorial](docs/tutorial.md)
- [Rules and assertion contract](scenarios.json)
- [Customer adaptation and mapping](docs/adapting-to-salesforce.md)
- [All-module roadmap](docs/module-roadmap.md)
- [Validation and known limits](docs/validation.md)
- [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md)

The demo server binds only to 127.0.0.1. Its persona picker is a teaching control, not authentication. Do not expose it publicly, use production records, or treat it as a secure application scaffold.

## Keep the source, get help when useful

Use, modify and run the source locally under the [MIT license](LICENSE). ContextQA can help assess applicability and plan customer-specific verification. This repository does not promise hosted execution or ongoing support for free.

[Explore ContextQA](https://contextqa.com/?utm_source=github&utm_medium=developer_referral&utm_campaign=salesforce_selenium_starter&utm_content=readme) · [Discuss a workflow](https://contextqa.com/book-a-demo/?utm_source=github&utm_medium=developer_referral&utm_campaign=salesforce_selenium_starter&utm_content=workflow_help) · [Salesforce learning guides](https://learning.contextqa.com/packaged-application-testing/salesforce-testing)

[Playwright edition](https://github.com/contextqaai/salesforce-playwright-starter) contains the same business scenarios in the other framework.

## Native Salesforce API companion

Three opt-in native API checks were verified in one approved test org: lead conversion, case closure and required-field rejection, with cleanup. These use Node HTTP in both repos and are separate from synthetic browser coverage. See [setup, evidence and limitations](docs/native-api-companion.md).
