# Security and data notes

Signal Room is a local learning demo with made-up errors. It has no login or separate user workspaces. Use it only with the included examples.

## What it accepts and keeps

The API accepts three scenario IDs and two release labels. It does not accept custom errors, attachments, user details, URLs or SDK settings.

The SDK uses a separate client and scope for each capture. Default integrations, runtime channel injection, tracing and client reports are disabled. SDK data-collection settings disable identity, cookies, request contents, source context, variables, database/queue contents and AI, MCP and GraphQL contents.

Before storing an event, the app rebuilds it from approved fields. The local transport checks those fields again and drops protocol headers and non-event items. User details, request data, hostnames, full file paths and breadcrumbs are left out.

The reserved example DSN is never used as a network destination. Environment DSNs, tokens and Spotlight settings cannot turn on uploads. These rules are for the fixed demo errors; they have not been verified as a filter for arbitrary production data.

## Request checks

- The server listens on this computer only by default. Other bindings require an explicit HTTP(S) `APP_ORIGIN`.
- The Host header must match that origin. Browser writes also need a matching Origin, JSON and the custom action header. Cross-site Fetch requests are denied.
- Browser API calls omit credentials, including cookies from other local apps. No CORS permission is granted.
- Requests are limited to 2 KB, including streamed bodies. Headers and request time are limited too.
- Unknown fields, choices, statuses and issue IDs are rejected.
- By default, each source IP can make 30 writes per minute. The limiter holds at most 256 entries and ignores forwarded IP headers.
- The app serves only named static files. It sets browser security headers, blocks framing, asks browsers not to cache responses and asks search engines not to index it.
- Dynamic text is escaped or displayed with `textContent`. Builds do not include source maps.

The limiter briefly holds IP addresses in memory. It does not put them in events or app logs. A host or proxy may keep its own logs.

## Shared data

There are three possible issue groups. The app keeps the latest 200 events and 20 examples per issue. Counts can be higher than the number of saved examples.

Everyone using one running server shares its inbox. Clearing it affects everyone; restarting removes the old data and loads new examples. This is not private or permanent storage.

No payments, external inventory calls, mail or cloud authorization take place. The zero-upload label describes this app's local transport; it is not a live network meter.

## Report a problem

Open an issue for an ordinary demo bug. Contact the owner privately through an established channel for sensitive findings. Do not publish credentials or real error data. Review dependencies and the lockfile when upgrading.
