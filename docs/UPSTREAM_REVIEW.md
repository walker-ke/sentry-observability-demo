# Scoped upstream review: getsentry/sentry

Reviewed 26 October 2026. Reference snapshot: [`9f79f84e4787cb35c5c322be0f4dc0967e1c6463`](https://github.com/getsentry/sentry/tree/9f79f84e4787cb35c5c322be0f4dc0967e1c6463).

## Scope

This is a portfolio-oriented review of selected public repository metadata, root documentation, license, dependency manifests and development guidance. It is **not** a complete architecture/security audit or full Git-history scan of Sentry. No private Sentry data, service credentials, running installation or internal systems were accessed. Nothing was changed upstream.

The reference snapshot's license, package manifest and Python manifest were read at that exact commit. Root README and development guidance were also inspected. Upstream tests/builds were not run and the complete repository/history was not cloned. No claim is made that Sentry is free of secrets or vulnerabilities.

## Architecture and feature overview

The [README](https://github.com/getsentry/sentry/blob/9f79f84e4787cb35c5c322be0f4dc0967e1c6463/README.md) describes a developer debugging platform and points to issue details, traces, replay, insights, logs and uptime workflows. It links separate official SDK repositories for many languages. The server platform and the client SDKs are separate projects.

The root manifests show a large Python/Django backend and a React/TypeScript frontend. The [Python manifest](https://github.com/getsentry/sentry/blob/9f79f84e4787cb35c5c322be0f4dc0967e1c6463/pyproject.toml) declares Python >=3.13 and 114 entries in its primary dependency list. Examples include Django/DRF, asyncpg/psycopg2, Redis clients, Kafka/Arroyo, Snuba, Relay and Symbolic-related packages. Those dependencies indicate substantial service/ingestion/query/symbolication integration; they do not establish every production topology or enabled feature.

The [frontend manifest](https://github.com/getsentry/sentry/blob/9f79f84e4787cb35c5c322be0f4dc0967e1c6463/package.json) declares 38 direct dependency entries and 36 development entries at the root. It specifies React 19.3.0, a TypeScript 6 package alias, pnpm 12.10.1 and Rsbuild-oriented build commands. Workspace and lockfiles are present. This is a much larger operational footprint than a small standalone portfolio app.

## Documentation and reproducibility

The repository provides a root README, development instructions, agent guidance, test tooling, frontend/backend configuration, fixtures, API documentation and extensive source/test directories. Development guidance specifies a virtual environment, managed dependencies and supporting development services. It directs contributors to area-specific instructions and targeted tests.

The guidance explicitly says that the UI-only development command proxies API traffic to production Sentry infrastructure. That workflow was **not** used for this project. The local SDK demo has its own server, data and transport instead of requiring an account or interacting with a production Sentry organization.

Upstream build/test success, operational scale, complete dependency health and deployment compatibility were not independently verified here. A manifest review is not a complete transitive dependency audit.

## License and authorship boundary

The platform's [LICENSE.md](https://github.com/getsentry/sentry/blob/9f79f84e4787cb35c5c322be0f4dc0967e1c6463/LICENSE.md) identifies **FSL-1.1-Apache-2.0**, with its own permitted-purpose, redistribution, notice, trademark and future-license terms. It must not be relabeled as this portfolio author's original MIT-licensed platform. This review does not grant rights over upstream work.

The [JavaScript SDK repository](https://github.com/getsentry/sentry-javascript) is a separate project. Its published Node/Core packages used here identify MIT licensing. SDK dependencies have their own licenses; they are credited separately in this demo's notices.

This portfolio project therefore implements an **original SDK integration**, not a rebranded export of the server platform. No core platform source, screenshots, logos, deployment configuration, history or customer records were copied. The local grouping and workflow are clearly described as original teaching logic rather than Sentry's algorithms.

## Security and sensitive material

An error-monitoring installation can contain exception text, user identifiers, request URLs/headers/bodies, IP addresses, breadcrumbs, source context, attachments, replay data, infrastructure names and integrations. Those are risk categories, not a finding that they appear in the inspected public source.

For a portfolio, keep actual project DSNs, organization/project identifiers tied to private accounts, auth tokens, integrations, production events, customer screenshots, session data, internal hostnames, source-map credentials and operational configuration out of the demo. A client DSN is not equivalent to a secret auth token, but there is no reason for this local educational demo to publish or use a real one.

Upstream public fixtures may be synthetic; their provenance was not exhaustively assessed. No original fixture datasets were imported. A complete upstream-history scan and secret validation were outside this review, so this report must not be represented as clearing Sentry's whole history for reuse.

## Safe showcase decision

| Material | Treatment in this project |
|---|---|
| General SDK integration concepts and public architecture references | Explain with links and attribution |
| Official Node/Core SDK packages | Use pinned packages and retain upstream notices |
| Original scenario runner, privacy projection, local transport, tests and UI | Suitable showcase material under this project's license |
| Core Sentry platform source/history | Not copied; retains its own authorship and license |
| Sentry logos, product screenshots, production organization data | Not copied |
| Real DSNs, tokens, account-specific telemetry or customer context | Not used or published |
| Claims of reproducing Sentry grouping, symbolication, alerting or scale | Not made |

## Separate-demo recommendation implemented

The resulting repository contains a small original Node/TypeScript app with an actual SDK capture pipeline, closed local transport, fixed synthetic scenarios, bounded memory, request validation, a clear data-policy view and tests. It starts without a cloud account or database. This demonstrates integration and privacy engineering while preserving upstream attribution.

See [VERIFICATION.md](VERIFICATION.md) for checks on **this demo**, not on the upstream platform.
