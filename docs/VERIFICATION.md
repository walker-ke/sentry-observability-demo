# What was checked — 26 October 2026

These results cover this demo. They do not cover the Sentry platform.

## Results

- TypeScript strict type checking passed.
- **24 automated tests passed** across HTTP, privacy, store, telemetry and transport suites.
- Actual official SDK capture into the local transport was verified for all three scenarios.
- One test blocked Node network functions (HTTP, HTTPS, sockets, TLS, DNS and fetch). Capturing the sample errors made no outside calls.
- A separate process supplied synthetic DSN/auth/release/environment/Spotlight settings. Capture stayed local and the supplied values did not appear in retained output.
- Privacy tests added made-up identity details, IPs, request data, private-looking paths, source context, variables and messages. None appeared in the saved events.
- Transport tests dropped session, attachment, transaction and client-report items and discarded envelope headers.
- Retention, duplicate retained IDs, resolution/reopening/recurrence, snapshot isolation and reset passed.
- HTTP tests covered Origin/Host denial, extra/prototype fields, invalid enum/status values, malformed JSON, content type, fixed and chunked size limits, rate limits, static allowlisting and response security headers.
- Server/browser build passed with no source maps.
- Browser capture, issue resolution, subsequent regression and the Data policy view were exercised against the local server. The screenshots show only synthetic scenarios.

Errors are grouped by sample scenario. Any new event reopens a resolved issue as regressed, on either release. This is the demo's rule. Tests with these fixed examples do not prove that the filter would protect arbitrary production data.

The app's store has three possible issue groups, last-200 event retention and up to 20 examples per issue. There is no persistence, browser replay, cloud account, authentication or original upstream installation involved.

## Independent review

Claude independently reviewed the credential-free design. Suggestions about a dedicated SDK client, package-version drift, environment isolation, a second transport projection, unsupported envelope items, chunked-body tests and clear grouping/ownership claims were checked against implementation. The code uses SDK 11's typed dataCollection options rather than relying on removed legacy flags. No customer data or credentials were shared.

Dependency audit and source-secret-scan results are recorded in [the publication checklist](PUBLICATION_CHECKLIST.md). A clean source export also passed installation, formatting, tests, build and a compiled-server startup smoke check with six local SDK events. Future hosting, proxies or changes require their own review. The review did not audit the whole Sentry platform or its Git history.
