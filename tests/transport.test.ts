import { test } from "node:test";
import assert from "node:assert/strict";
import type { Envelope } from "@sentry/core";
import { createLocalTransport } from "../src/server/local-transport.js";
import { IssueStore } from "../src/server/store.js";
test("transport drops non-event envelope items and does not retain protocol headers", async () => {
  const store = new IssueStore();
  const transport = createLocalTransport(store);
  // Deliberately mixed protocol items exercise defensive filtering beyond SDK typing.
  const envelope = [
    {
      event_id: "private-header",
      dsn: "https://private-header.example.invalid/1",
    },
    [
      [
        { type: "session" },
        {
          init: true,
          sid: "c".repeat(32),
          timestamp: "2026-01-01T00:00:00Z",
          started: "2026-01-01T00:00:00Z",
          status: "ok",
          errors: 0,
          attrs: { release: "synthetic-private" },
        },
      ],
      [
        { type: "attachment", length: 17, filename: "synthetic.txt" },
        new TextEncoder().encode("synthetic-private"),
      ],
      [{ type: "transaction" }, { name: "synthetic-private" }],
      [{ type: "client_report" }, { discarded_events: [] }],
      [
        { type: "event" },
        {
          event_id: "b".repeat(32),
          release: "sandbox@1.4.0",
          tags: { scenario_id: "inventory-timeout" },
          user: { email: "synthetic-private@example.test" },
          extra: { private: "synthetic-private" },
        },
      ],
    ],
  ] as unknown as Envelope;
  await transport.send(envelope);
  assert.equal(store.totalCaptured, 1);
  const serialized = JSON.stringify(store.snapshot());
  assert.ok(!serialized.includes("private-header"));
  assert.ok(!serialized.includes("synthetic-private"));
  assert.equal(await transport.flush(1000), true);
});
