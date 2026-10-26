import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import http from "node:http";
import { createDemoServer } from "../src/server/http.js";
const options = { seed: false, publicDir: resolve("src/client") };
async function setup(maxWrites = 30) {
  const app = createDemoServer({ ...options, maxWrites });
  const origin = await app.listen();
  return { app, origin };
}
function post(
  origin: string,
  data: unknown,
  extra: Record<string, string> = {},
) {
  return {
    method: "POST",
    headers: {
      Origin: origin,
      "X-Demo-Action": "1",
      "Content-Type": "application/json",
      ...extra,
    },
    body: JSON.stringify(data),
  };
}
test("HTTP capture, issue state and reset use a real local SDK", async () => {
  const { app, origin } = await setup();
  try {
    let response = await fetch(
      origin + "/api/capture",
      post(origin, { scenario: "checkout-null", release: "sandbox@1.4.0" }),
    );
    assert.equal(response.status, 201);
    const data = await response.json();
    assert.equal(data.issues[0].count, 1);
    assert.equal(data.mode, "local-only");
    response = await fetch(
      origin + "/api/issues/LAB-1001/status",
      post(origin, { status: "resolved" }),
    );
    assert.equal(response.status, 200);
    await fetch(
      origin + "/api/capture",
      post(origin, { scenario: "checkout-null", release: "sandbox@1.4.1" }),
    );
    assert.equal(app.store.snapshot().issues[0]!.status, "regressed");
    await fetch(origin + "/api/reset", post(origin, {}));
    assert.equal(app.store.totalCaptured, 0);
  } finally {
    await app.close();
  }
});
test("foreign or missing Origin and missing custom header are denied", async () => {
  const { app, origin } = await setup();
  try {
    for (const headers of [
      { Origin: "https://foreign.example.test", "X-Demo-Action": "1" },
      { "X-Demo-Action": "1" },
      { Origin: origin },
    ]) {
      const response = await fetch(origin + "/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers } as Record<
          string,
          string
        >,
        body: "{}",
      });
      assert.equal(response.status, 403);
    }
    assert.equal(app.store.totalCaptured, 0);
  } finally {
    await app.close();
  }
});
test("malformed, arbitrary, extra/prototype fields and unknown enums are rejected", async () => {
  const { app, origin } = await setup();
  try {
    for (const data of [
      null,
      [],
      { scenario: "unknown", release: "sandbox@1.4.0" },
      { scenario: "checkout-null", release: "private" },
      {
        scenario: "checkout-null",
        release: "sandbox@1.4.0",
        user: "real-data",
      },
      JSON.parse('{"__proto__":{"polluted":true}}'),
    ])
      assert.equal(
        (await fetch(origin + "/api/capture", post(origin, data))).status,
        400,
      );
    assert.equal(
      (
        await fetch(origin + "/api/capture", {
          ...post(origin, {}),
          body: "invalid json",
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await fetch(
          origin + "/api/issues/LAB-1001/status",
          post(origin, { status: "deleted" }),
        )
      ).status,
      400,
    );
    assert.equal(app.store.totalCaptured, 0);
  } finally {
    await app.close();
  }
});
test("content type, body size and rate limits are enforced", async () => {
  const { app, origin } = await setup(3);
  try {
    assert.equal(
      (
        await fetch(
          origin + "/api/capture",
          post(origin, {}, { "Content-Type": "text/plain" }),
        )
      ).status,
      415,
    );
    assert.equal(
      (
        await fetch(
          origin + "/api/capture",
          post(origin, {}, { "Content-Type": "application/jsonp" }),
        )
      ).status,
      415,
    );
    assert.equal(
      (
        await fetch(
          origin + "/api/capture",
          post(origin, { junk: "x".repeat(3000) }),
        )
      ).status,
      413,
    );
    assert.equal(
      (await fetch(origin + "/api/capture", post(origin, {}))).status,
      429,
    );
  } finally {
    await app.close();
  }
});
test("static allowlist and security headers cover successful and error responses", async () => {
  const { app, origin } = await setup();
  try {
    for (const path of [
      "/",
      "/api/state",
      "/.env",
      "/.git/config",
      "/src/server/http.ts",
      "/%2e%2e%2fpackage.json",
    ]) {
      const response = await fetch(origin + path);
      assert.equal(response.headers.get("x-content-type-options"), "nosniff");
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
      assert.match(
        response.headers.get("content-security-policy")!,
        /frame-ancestors 'none'/,
      );
      if (!["/", "/api/state"].includes(path))
        assert.equal(response.status, 404);
    }
    assert.equal(
      (await fetch(origin + "/api/state?token=synthetic")).status,
      400,
    );
    assert.equal(
      (await fetch(origin + "/api/reset", { method: "OPTIONS" })).status,
      404,
    );
  } finally {
    await app.close();
  }
});
test("unexpected Host is rejected without touching data", async () => {
  const { app, origin } = await setup();
  try {
    const status = await new Promise<number>((done, reject) => {
      const request = http.get(
        origin + "/api/state",
        { headers: { Host: "foreign.example.test" } },
        (response) => {
          response.resume();
          done(response.statusCode!);
        },
      );
      request.on("error", reject);
    });
    assert.equal(status, 403);
  } finally {
    await app.close();
  }
});
test("non-loopback exposure requires an explicitly configured origin", async () => {
  const app = createDemoServer(options);
  try {
    await assert.rejects(app.listen(0, "0.0.0.0"), /APP_ORIGIN/);
  } finally {
    await app.close();
  }
});

test("chunked bodies are capped while streaming", async () => {
  const { app, origin } = await setup();
  try {
    const status = await new Promise<number>((done, reject) => {
      const request = http.request(
        origin + "/api/capture",
        {
          method: "POST",
          headers: {
            Origin: origin,
            "X-Demo-Action": "1",
            "Content-Type": "application/json",
            "Transfer-Encoding": "chunked",
          },
        },
        (response) => {
          response.resume();
          done(response.statusCode!);
        },
      );
      request.on("error", reject);
      request.write('{"junk":"');
      request.write("x".repeat(2300));
      request.end('"}');
    });
    assert.equal(status, 413);
  } finally {
    await app.close();
  }
});
