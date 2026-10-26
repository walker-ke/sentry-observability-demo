import { test } from "node:test";
import assert from "node:assert/strict";
import type { ErrorEvent } from "@sentry/node";
import { sanitizeEvent, toSafeEvent } from "../src/server/privacy.js";
function fixture(): ErrorEvent {
  return {
    type: undefined,
    event_id: "a".repeat(32),
    timestamp: 1234,
    release: "sandbox@1.4.0",
    tags: { scenario_id: "checkout-null" },
  };
}
test("allowlist drops identities, bodies, paths, variables, messages and arbitrary context", () => {
  const event = fixture();
  Object.assign(event, {
    user: { email: "fictional-person@example.test", ip_address: "192.0.2.10" },
    request: {
      url: "https://private.example.test/?token=synthetic",
      headers: { Authorization: "synthetic-credential" },
    },
    extra: { password: "synthetic-secret" },
    contexts: { os: { name: "private-host" } },
    server_name: "private-machine",
    breadcrumbs: [{ message: "sensitive breadcrumb" }],
    message: "Untrusted real message",
  });
  event.exception = {
    values: [
      {
        type: "UntrustedType",
        value: "Untrusted message",
        stacktrace: {
          frames: [
            {
              filename: "/home/fictional/private-file.ts",
              abs_path: "C:\\Private\\file.ts",
              function: "submitOrder",
              lineno: 27,
              vars: { password: "synthetic-secret" },
              context_line: "private code",
            },
          ],
        },
      },
    ],
  };
  const safe = sanitizeEvent(event)!;
  const text = JSON.stringify(safe);
  for (const value of [
    "fictional-person",
    "192.0.2.10",
    "private.example.test",
    "synthetic-secret",
    "private-host",
    "private-machine",
    "private code",
    "private-file",
    "Untrusted",
    "sensitive breadcrumb",
  ])
    assert.ok(!text.includes(value), value);
  assert.deepEqual(
    Object.keys(safe).sort(),
    [
      "type",
      "event_id",
      "timestamp",
      "platform",
      "environment",
      "release",
      "level",
      "fingerprint",
      "tags",
      "exception",
    ].sort(),
  );
  assert.equal(
    safe.exception!.values![0]!.stacktrace!.frames![0]!.filename,
    "demo/scenarios.ts",
  );
});
test("unknown scenarios and releases are dropped", () => {
  for (const bad of [
    { ...fixture(), tags: { scenario_id: "unknown" } },
    { ...fixture(), release: "private-release" },
  ])
    assert.equal(sanitizeEvent(bad), null);
});
test("invalid event IDs and frame line numbers do not pass through", () => {
  const event = fixture();
  event.event_id = "<script>not-an-id</script>";
  event.exception = {
    values: [
      {
        stacktrace: { frames: [{ function: "submitOrder", lineno: Infinity }] },
      },
    ],
  };
  const safe = toSafeEvent(event)!;
  assert.match(safe.id, /^[a-f0-9]{32}$/);
  assert.equal(safe.frame.line, 3);
});
test("transport projection retains exactly the documented keys", () => {
  const safe = toSafeEvent(fixture())!;
  assert.deepEqual(
    Object.keys(safe).sort(),
    [
      "id",
      "scenario",
      "timestamp",
      "release",
      "type",
      "message",
      "level",
      "service",
      "frame",
    ].sort(),
  );
  assert.equal(toSafeEvent(null), null);
  assert.equal(toSafeEvent("an event"), null);
});
test("a second allowlist pass is stable", () => {
  const first = sanitizeEvent(fixture())!;
  assert.deepEqual(sanitizeEvent(first), first);
});
