# Verification — 26 October 2026

Checks apply to this original integration app, not the upstream Sentry platform.

## Executed

- TypeScript strict type checking passed.
- **24 automated tests passed** across HTTP, privacy, store, telemetry and transport suites.
- Actual official SDK capture into the local transport was verified for all three scenarios.
- A no-egress test denied Node HTTP/HTTPS/socket/TLS/DNS/fetch functions and captured the scenarios with zero outbound calls from that pipeline.
- A separate process supplied synthetic DSN/auth/release/environment/Spotlight settings. Capture stayed local and the supplied values did not appear in retained output.
- Projection tests supplied fictional identity, IP, request headers/body context, private-looking paths, source/variable context and arbitrary messages; those values were absent from retained events.
- Transport tests dropped session, attachment, transaction and client-report items and discarded envelope headers.
- Retention, duplicate retained IDs, resolution/reopening/recurrence, snapshot isolation and reset passed.
- HTTP tests covered Origin/Host denial, extra/prototype fields, invalid enum/status values, malformed JSON, content type, fixed and chunked size limits, rate limits, static allowlisting and response security headers.
- Server/browser build passed with no source maps.
- Browser capture, issue resolution, subsequent regression and the Data policy view were exercised against the local server. The screenshots show only synthetic scenarios.

Grouping is deliberately scenario-based. A new event on any listed release regresses a resolved issue; it does not reproduce Sentry's server algorithm. Tests of fixed synthetic inputs do not certify privacy filtering for arbitrary production telemetry.

The app's store has three possible issue groups, last-200 event retention and up to 20 examples per issue. There is no persistence, browser replay, cloud account, authentication or original upstream installation involved.

## Review contribution

Claude independently reviewed the credential-free design. Suggestions about a dedicated SDK client, package-version drift, environment isolation, a second transport projection, unsupported envelope items, chunked-body tests and clear grouping/ownership claims were checked against implementation. The code uses SDK 11's typed dataCollection options rather than relying on removed legacy flags. No customer data or credentials were delegated.

Dependency audit and source-secret-scan results are recorded in [the publication checklist](PUBLICATION_CHECKLIST.md). A clean source export also passed installation, formatting, tests, build and a compiled-server startup smoke check with six local SDK events. Future hosting, proxies or changes require their own review. No whole-upstream security audit or full-history clearance is claimed.
