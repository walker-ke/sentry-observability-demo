# Security and data boundaries

Signal Room is an educational, synthetic local SDK integration. It is not a production monitoring system and has no authentication or tenant isolation.

## Capture boundary

The server accepts only three fixed scenario IDs and two fixed release labels. It does not accept arbitrary error messages, telemetry envelopes, attachments, user details, URLs or SDK options over HTTP. The Node SDK is instantiated with a dedicated client and per-capture scopes, no default integrations, no runtime channel injection, no tracing samples and no client reports.

SDK 11's `dataCollection` options explicitly disable user data, cookies, HTTP headers/bodies/query strings, source context, variables, queue payloads, database data, GraphQL contents, MCP contents and AI inputs/outputs. A `beforeSend` hook then rebuilds events from known values instead of relying on these settings alone.

The local transport discards envelope headers and all item types except `event`. It projects event fields again before retention. User/request/context fields, hostnames, absolute source paths and breadcrumbs do not reach the issue store. The reserved DSN never becomes a network destination. Environment DSNs, auth tokens and Spotlight settings are not consulted to create a transport.

This is a policy for known synthetic scenarios. It is **not** a universal PII-redaction solution for arbitrary telemetry. Real applications need their own consent, collection, retention, access and incident policies.

## HTTP boundary

- Loopback binding by default. Non-loopback binding requires an explicit plain HTTP(S) `APP_ORIGIN`.
- Host must match the configured origin. Browser writes require matching Origin, JSON content type and a custom action header; cross-site Fetch metadata is denied.
- No CORS permission, arbitrary static path serving or telemetry upload route.
- JSON bodies capped at 2 KB including chunked transfers, bounded header size and request timeout.
- Extra/prototype fields, unknown scenarios/releases/statuses and arbitrary issue IDs are rejected.
- Thirty writes per source IP per minute by default, with at most 256 limiter entries. Forwarded IP headers are not trusted.
- CSP, no-store responses, frame denial, no-referrer, nosniff and noindex are set.
- UI dynamic data is either escaped or assigned through `textContent`. Static files are served from an explicit name map. No source maps are shipped.

The limiter temporarily retains source IPs in memory; those values are never event payloads or application logs. No guarantee is made about external proxy/system logs if you choose to host the app.

## Retention and concurrency

Only three fixed issue groups can exist. The inbox retains the last 200 events and 20 examples per issue; session counters can exceed the retained example count. Restart and Clear session remove the process dataset. Visitors share one synthetic state. It is not a durable or per-user session store; concurrent visitors may resolve or clear the same fictional issues.

No real payment, external inventory request, mail, cloud authorization or real-world transaction is performed. Do not supply real customer data. The UI's zero-upload label is an implementation property of this closed local transport, not a live network-traffic meter or claim about all possible future modifications.

## Reporting

Open a minimal public issue for ordinary demo bugs. For sensitive findings, contact the repository owner privately using an established channel; do not disclose credentials or real telemetry in issues. Keep SDK/dependency versions and the lockfile under review when upgrading.
