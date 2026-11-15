# Module readiness

Only the synthetic scenarios in `scenarios.json` are implemented in this release. The following is a roadmap, not available native product coverage.

| Module | Current deliverable | Next requirement |
| --- | --- | --- |
| Sales Cloud | Synthetic lead-conversion examples | Native mappings and approved reference-org run |
| Service Cloud | Synthetic closure examples | Actual closure policy, persona and reference-org run |
| Permissions / Flow | Synthetic role and routing examples | Salesforce identity/sharing and active Flow assertions |
| Integrations / release | Adaptation guidance | Downstream contracts and scoped evidence |
| Revenue Cloud / CPQ / Billing | Planned | Separate product adapters, pricing and approval rules |
| Experience / Partner portals | Planned | Sharing and external-user environments |
| Field Service | Planned | Licensed scheduling and device/offline tests |
| Marketing Cloud | Planned | Actual APIs and safe message sinks |
| Agentforce / Data 360 | Planned | Grounding, tools and deterministic outcome checks |
| Insurance, Healthcare, Life Sciences | Planned | Native/custom model distinction and approved domain rules |
| Banking, Retail/Commerce/Loyalty, Finance/Procurement | Planned | Transaction policies and safe external integrations |
| Manufacturing, Public Sector, Education, Nonprofit | Planned | Domain-specific objects, rules and reference environments |
| Automotive, Energy/Utilities, Communications | Planned | Product-specific integrations and state transitions |

New packs must add distinct business assertions, synthetic setup, meaningful failure tests and maintained evidence. Do not generate industry-branded copies of generic CRUD tests and call them validated native coverage.
