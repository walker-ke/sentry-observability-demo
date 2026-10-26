# Release checks

These checks were completed for the first release on 26 October 2026.

- [x] The app and branding are original, with credit to Sentry for its SDK.
- [x] No Sentry server code, customer data, logos, screenshots or Git history were copied.
- [x] The original code has an MIT license. Third-party license notices are included.
- [x] All examples are fictional. No real account or live DSN is needed.
- [x] Capture stays local. There is no upload option or browser tracking.
- [x] TypeScript, formatting, 24 tests and the build passed.
- [x] Request limits, privacy rules, environment settings and data limits were checked.
- [x] Capture, resolution, recurrence and the explanatory screens were tried in the browser.
- [x] npm audit found no known vulnerabilities at the time.
- [x] Gitleaks v8.30.1 found no leaks in the proposed source export.
- [x] A fresh source export installed, passed checks and started with six SDK-generated local events.

The GitHub Verify workflow repeats automated checks after publication. These results cover this demo, not the whole Sentry platform or a future hosted website.
