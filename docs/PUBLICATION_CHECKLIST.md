# Publication checklist

Completed for the initial source release on 26 October 2026:

- [x] Original app/branding; Sentry SDK and upstream platform authorship distinguished.
- [x] No upstream server code, customer fixtures, Sentry screenshots/logos or original Git history copied.
- [x] Separate MIT license for original code and preserved third-party notices.
- [x] Fixed fictional scenarios and release labels; no real account or live DSN required.
- [x] Local-only SDK transport; no upload configuration or browser analytics/replay.
- [x] Strict TypeScript, formatting, 24 tests and build passed.
- [x] Request boundaries, no-egress behavior, environment isolation and retention checked.
- [x] Browser capture, resolution/regression, data policy and architecture views checked.
- [x] npm audit reported zero known vulnerabilities at review time.
- [x] Gitleaks v8.30.1 reported no source leaks in the proposed initial export.
- [x] Clean source export passed installation, formatting, tests, build and compiled-server startup with six real SDK-generated local events.

This checklist describes the demo's initial local verification. The repository's Verify workflow repeats the automated checks after publication. It is not a full audit of getsentry/sentry or a hosted production deployment.
