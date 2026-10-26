import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { IssueStore } from "../src/server/store.js";
import type { SafeEvent } from "../src/shared.js";
function event(overrides: Partial<SafeEvent> = {}): SafeEvent {
  return {
    id: randomUUID().replaceAll("-", ""),
    scenario: "checkout-null",
    timestamp: Date.now() / 1000,
    release: "sandbox@1.4.0",
    type: "TypeError",
    message: "Synthetic",
    level: "error",
    service: "checkout-api",
    frame: { filename: "demo/scenarios.ts", function: "submitOrder", line: 3 },
    ...overrides,
  };
}
test("grouping is scenario-based across releases and normalized frame lines", () => {
  const store = new IssueStore();
  store.add(event());
  store.add(
    event({
      release: "sandbox@1.4.1",
      frame: {
        filename: "demo/scenarios.ts",
        function: "submitOrder",
        line: 99,
      },
    }),
  );
  const value = store.snapshot();
  assert.equal(value.issues.length, 1);
  assert.equal(value.issues[0]!.count, 2);
  assert.equal(value.issues[0]!.releases.length, 2);
});
test("duplicate retained IDs do not increment counts", () => {
  const store = new IssueStore();
  const e = event();
  store.add(e);
  store.add(e);
  assert.equal(store.totalCaptured, 1);
});
test("any recurrence after resolution is a regression, independent of release", () => {
  for (const release of ["sandbox@1.4.0", "sandbox@1.4.1"] as const) {
    const store = new IssueStore();
    store.add(event());
    assert.equal(store.setStatus("LAB-1001", "resolved"), true);
    store.add(event({ release }));
    assert.equal(store.snapshot().issues[0]!.status, "regressed");
    assert.equal(store.setStatus("LAB-1001", "open"), true);
    assert.equal(store.snapshot().issues[0]!.status, "open");
  }
});
test("unknown issue statuses cannot target another issue", () => {
  assert.equal(new IssueStore().setStatus("LAB-9999", "resolved"), false);
});
test("retention is bounded and snapshots cannot mutate stored state", () => {
  const store = new IssueStore();
  for (let i = 0; i < 230; i++) store.add(event());
  const snapshot = store.snapshot();
  assert.equal(snapshot.events.length, 200);
  assert.equal(snapshot.issues[0]!.events.length, 20);
  assert.equal(store.totalCaptured, 230);
  snapshot.issues[0]!.count = 0;
  assert.equal(store.snapshot().issues[0]!.count, 230);
});
test("reset discards all events and issue state", () => {
  const store = new IssueStore();
  store.add(event());
  store.reset();
  assert.equal(store.totalCaptured, 0);
  assert.deepEqual(store.snapshot().issues, []);
  assert.deepEqual(store.snapshot().events, []);
});
