import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import dns from "node:dns";
import { createTelemetry } from "../src/server/telemetry.js";
import { IssueStore } from "../src/server/store.js";

test("real SDK captures all scenarios with zero outbound transport calls", async (t) => {
  let networkCalls = 0;
  const deny = () => {
    networkCalls++;
    throw new Error("Unexpected network access");
  };
  t.mock.method(http, "request", deny);
  t.mock.method(https, "request", deny);
  t.mock.method(net.Socket.prototype, "connect", deny);
  t.mock.method(tls, "connect", deny);
  t.mock.method(dns, "lookup", deny);
  t.mock.method(globalThis, "fetch", deny);
  const store = new IssueStore();
  const telemetry = createTelemetry(store);
  try {
    for (const scenario of [
      "checkout-null",
      "inventory-timeout",
      "payment-unavailable",
    ] as const)
      await telemetry.capture(scenario, "sandbox@1.4.1");
    assert.equal(store.snapshot().issues.length, 3);
    assert.equal(store.totalCaptured, 3);
    assert.equal(networkCalls, 0);
    assert.match(telemetry.sdkVersion, /^\d+\.\d+/);
  } finally {
    await telemetry.close();
  }
});
test("SDK capture groups, resolves and regresses through actual envelopes", async () => {
  const store = new IssueStore();
  const telemetry = createTelemetry(store);
  try {
    const id = await telemetry.capture("checkout-null", "sandbox@1.4.0");
    assert.match(id, /^[a-f0-9]{32}$/);
    store.setStatus("LAB-1001", "resolved");
    await telemetry.capture("checkout-null", "sandbox@1.4.1");
    assert.equal(store.snapshot().issues[0]!.status, "regressed");
    assert.equal(store.totalCaptured, 2);
    assert.equal(store.snapshot().events[0]!.release, "sandbox@1.4.1");
  } finally {
    await telemetry.close();
  }
});
test("no global exception handlers are installed and client listeners are cleaned up", async () => {
  const crashes = process.listenerCount("uncaughtException");
  const exits = process.listenerCount("beforeExit");
  const telemetry = createTelemetry(new IssueStore());
  assert.equal(process.listenerCount("uncaughtException"), crashes);
  await telemetry.close();
  assert.equal(process.listenerCount("beforeExit"), exits);
});

test("environment DSNs and telemetry settings cannot switch the app to network capture", async () => {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const code = `
    import assert from 'node:assert/strict';
    import https from 'node:https'; import net from 'node:net';
    import {IssueStore} from './src/server/store.ts';
    import {createTelemetry} from './src/server/telemetry.ts';
    let calls=0;https.request=()=>{calls++;throw Error('network');};net.Socket.prototype.connect=function(){calls++;throw Error('network');};
    const store=new IssueStore();const sdk=createTelemetry(store);
    try{await sdk.capture('checkout-null','sandbox@1.4.0');const text=JSON.stringify(store.snapshot());assert.equal(calls,0);assert.equal(store.totalCaptured,1);for(const forbidden of ['private-env-release','private-env-host','private-env-user','synthetic-auth-value'])assert.ok(!text.includes(forbidden));}finally{await sdk.close();}
  `;
  await promisify(execFile)(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "-e", code],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        SENTRY_DSN: "https://private-env-user@telemetry.example.invalid/1",
        SENTRY_RELEASE: "private-env-release",
        SENTRY_ENVIRONMENT: "private-env-host",
        SENTRY_NAME: "private-env-host",
        SENTRY_AUTH_TOKEN: "synthetic-auth-value",
        SENTRY_SPOTLIGHT: "http://spotlight.example.invalid",
        SENTRY_TRACES_SAMPLE_RATE: "1",
      },
    },
  );
});
