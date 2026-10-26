# Signal Room — Sentry observability demo

An **original portfolio integration** using the official Sentry Node SDK. Trigger controlled exceptions, inspect the retained payload, resolve issues, and recapture them to explore a simple regression workflow.

The app runs without a Sentry account and **never uploads telemetry**. A custom transport projects SDK events into a bounded, local, in-memory inbox. Every service, release and error scenario is fictional.

This repository contains an original application, not a copy of `getsentry/sentry`. Sentry's SDK/platform belong to their respective authors. This project is not affiliated with or endorsed by Sentry.

![Signal Room issue inbox](docs/screenshots/inbox.jpg)

## Run locally

Requires **Node 22.12+** and npm. No database, Docker, OAuth account or cloud service is needed.

```sh
npm ci --ignore-scripts
npm run check
npm start
```

Open [http://127.0.0.1:8130](http://127.0.0.1:8130). Six initial events are captured through the SDK during startup. The server binds to loopback by default; use the exact origin it prints. Port override: `PORT=8131 npm start`.

For development, `npm run dev` builds browser assets and watches server sources. Re-run `npm run build` and reload after editing browser files. `.env.example` documents the two basic settings; the app does not automatically load `.env` files or need service credentials.

## Try the workflow

1. Choose **Checkout total is missing**, then **Capture this error**. The real SDK parses an exception and sends an event to the local transport.
2. Select the issue and inspect its normalized SDK frame and allowlisted retained payload. The source sketch is illustrative; it is not source-map symbolication.
3. Click **Mark resolved**, then **Capture again**. A recurrence after resolution becomes `regressed`, on either listed release.
4. Try the inventory timeout or payment-unavailable scenario. Neither contacts an inventory server or payment provider.
5. Filter issues by status or search locally. **Data policy** explains what is retained and discarded; **How it works** shows the architecture and provenance.
6. **Clear session** discards this process's event/issue dataset. Restarting the server also creates a fresh demo dataset.

Grouping is this app's simple fixed-scenario grouping, **not Sentry's backend grouping algorithm**. Regression is also deliberately simple: any new event on a resolved issue reopens it as regressed, regardless of release order. Only the last 200 events and 20 examples per issue are retained; counts describe the current process session. The three fixed scenarios bound the issue set.

## What the project demonstrates

- A standalone `NodeClient` and per-capture scopes using pinned official SDK packages.
- Actual exception capture and stack parsing through the SDK envelope pipeline.
- A `beforeSend` allowlist, followed by a second projection at the transport boundary.
- A transport that discards protocol headers and non-event items, with no HTTP upload fallback.
- A small original issue workflow: grouping, counters, resolution, reopening, recurrence and release labels.
- Strict scenario/API validation, request/body limits, same-origin action checks, Host checks and bounded memory.
- An accessible, responsive TypeScript/CSS interface with local assets and no browser analytics.
- Tests for no egress, environment isolation, privacy projection, lifecycle and HTTP boundaries.

The app does not implement Sentry's ingestion service, source-map symbolication, distributed tracing, alerting, persistence, teams, authentication, profiling or session replay. It is a local educational lab, not a production monitoring service or a replacement for Sentry.

## Verify

```sh
npm run typecheck
npm test
npm run build
npm run format:check
npm audit
```

`npm run check` combines type checking, tests and build. The test suite exercises actual SDK capture into local transport; network functions are denied during a dedicated no-egress test. Other tests cover hostile optional context, session/attachment/transaction/client-report filtering, invalid Origin/Host/content type, oversized regular/chunked bodies, unknown fields and rate limits.

See [verification evidence](docs/VERIFICATION.md), [architecture](docs/ARCHITECTURE.md), [security boundaries](SECURITY.md) and the [scoped upstream repository review](docs/UPSTREAM_REVIEW.md).

## Privacy and hosting

No browser SDK, replay, cookies, user identity or real telemetry input is enabled. The app constructs events only from three predefined scenarios. The only search input is a local DOM filter and is not submitted to the API. It is not a general-purpose scrubber for arbitrary production telemetry.

`SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, Sentry release/environment settings and Spotlight environment settings cannot enable upload. The standalone client uses an explicitly supplied local transport and a reserved `example.invalid` DSN solely for SDK envelope generation. It has no live-upload mode.

The app stores no database or telemetry files. It does temporarily track source IPs in a bounded process-local write limiter, without exposing them in events/API responses or logging them. All visitors to one process share its synthetic inbox; clearing it affects that whole demo session. Do not enter real information or expose it as a multi-user monitoring service.

Non-loopback binding requires an explicit `APP_ORIGIN`, with HTTPS termination and matching Host preservation at your proxy. This is a configuration guard, not a hosting security certification. Publishing this repository does not deploy a website.

## Provenance and license

Original application code is MIT licensed; see [LICENSE](LICENSE). Sentry Node/Core SDKs are separately MIT licensed. OpenTelemetry and other dependencies retain their own notices/licenses in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and `licenses/`.

No source, screenshots, logo, operational configuration, customer data or Git history from Sentry's platform is copied into this application. The upstream platform has its own license, distinct from the JavaScript SDK. Credit the SDK and this app's integration work separately when showcasing the project.
