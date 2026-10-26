import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { RELEASES, type Release, type ScenarioId } from "../shared.js";
import { SCENARIOS, getScenario } from "./scenarios.js";
import { IssueStore } from "./store.js";
import { createTelemetry } from "./telemetry.js";

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
interface ServerOptions {
  publicDir?: string;
  seed?: boolean;
  origin?: string;
  maxWrites?: number;
}
export function createDemoServer(options: ServerOptions = {}) {
  const store = new IssueStore();
  const telemetry = createTelemetry(store);
  const publicDir = options.publicDir ?? resolve("dist/public");
  const clients = new Map<string, { count: number; expires: number }>();
  const files: Record<string, [string, string]> = {
    "/": ["index.html", "text/html; charset=utf-8"],
    "/client.js": ["client.js", "application/javascript; charset=utf-8"],
    "/styles.css": ["styles.css", "text/css; charset=utf-8"],
  };
  let origin = "";
  function headers(response: ServerResponse) {
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
    );
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("X-Robots-Tag", "noindex, nofollow");
    response.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    response.setHeader("Cache-Control", "no-store");
  }
  function json(response: ServerResponse, status: number, payload: unknown) {
    response.statusCode = status;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(JSON.stringify(payload));
  }
  async function body(
    request: IncomingMessage,
  ): Promise<Record<string, unknown>> {
    if (
      !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(
        request.headers["content-type"] ?? "",
      )
    )
      throw new HttpError(415, "Send application/json.");
    if (Number(request.headers["content-length"]) > 2048) {
      request.resume();
      throw new HttpError(413, "Request is too large.");
    }
    let text = "";
    let bytes = 0;
    for await (const chunk of request) {
      bytes += Buffer.byteLength(chunk);
      if (bytes > 2048) {
        request.resume();
        throw new HttpError(413, "Request is too large.");
      }
      text += chunk;
    }
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch {
      throw new HttpError(400, "Send a valid JSON object.");
    }
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new HttpError(400, "Send a valid JSON object.");
    return value as Record<string, unknown>;
  }
  function keys(value: Record<string, unknown>, allowed: string[]) {
    if (Object.keys(value).some((key) => !allowed.includes(key)))
      throw new HttpError(400, "Only documented demo fields are accepted.");
  }
  const server = createServer(
    { maxHeaderSize: 8192, requestTimeout: 5000, headersTimeout: 5000 },
    (request, response) => {
      headers(response);
      void (async () => {
        if (request.headers.host !== new URL(origin).host)
          throw new HttpError(403, "Host is not allowed.");
        const url = new URL(request.url ?? "/", origin);
        if (url.search)
          throw new HttpError(400, "Query parameters are not accepted.");
        if (request.method === "GET" && url.pathname === "/api/state")
          return json(response, 200, {
            ...store.snapshot(),
            scenarios: SCENARIOS,
            sdkVersion: telemetry.sdkVersion,
            mode: "local-only",
          });
        if (request.method === "GET" && files[url.pathname]) {
          const [name, type] = files[url.pathname]!;
          try {
            const content = await readFile(resolve(publicDir, name));
            response.setHeader("Content-Type", type);
            response.end(content);
          } catch {
            throw new HttpError(404, "Build the demo assets first.");
          }
          return;
        }
        if (request.method !== "POST")
          throw new HttpError(404, "Route not found.");
        if (
          request.headers.origin !== origin ||
          request.headers["x-demo-action"] !== "1" ||
          request.headers["sec-fetch-site"] === "cross-site"
        )
          throw new HttpError(
            403,
            "Only same-origin demo actions are accepted.",
          );
        const now = Date.now();
        for (const [ip, value] of clients)
          if (value.expires <= now) clients.delete(ip);
        const ip = request.socket.remoteAddress ?? "local";
        const entry = clients.get(ip) ?? { count: 0, expires: now + 60000 };
        if (
          entry.count >= (options.maxWrites ?? 30) ||
          (!clients.has(ip) && clients.size >= 256)
        )
          throw new HttpError(
            429,
            "Demo limit reached. Try again in a minute.",
          );
        entry.count++;
        clients.set(ip, entry);
        const data = await body(request);
        if (url.pathname === "/api/capture") {
          keys(data, ["scenario", "release"]);
          if (
            !getScenario(data.scenario) ||
            !RELEASES.includes(data.release as Release)
          )
            throw new HttpError(400, "Choose a listed scenario and release.");
          const eventId = await telemetry.capture(
            data.scenario as ScenarioId,
            data.release as Release,
          );
          return json(response, 201, {
            eventId,
            ...store.snapshot(),
            scenarios: SCENARIOS,
            sdkVersion: telemetry.sdkVersion,
            mode: "local-only",
          });
        }
        const statusMatch = /^\/api\/issues\/(LAB-100[123])\/status$/.exec(
          url.pathname,
        );
        if (statusMatch) {
          keys(data, ["status"]);
          if (data.status !== "resolved" && data.status !== "open")
            throw new HttpError(400, "Choose open or resolved.");
          if (!store.setStatus(statusMatch[1]!, data.status))
            throw new HttpError(404, "Issue not found.");
          return json(response, 200, { ok: true });
        }
        if (url.pathname === "/api/reset") {
          keys(data, []);
          store.reset();
          return json(response, 200, { ok: true });
        }
        throw new HttpError(404, "Route not found.");
      })().catch((error) => {
        if (!response.headersSent)
          json(response, error instanceof HttpError ? error.status : 500, {
            error:
              error instanceof HttpError
                ? error.message
                : "The synthetic action could not complete.",
          });
        else response.end();
      });
    },
  );
  server.maxRequestsPerSocket = 100;
  return {
    server,
    store,
    telemetry,
    async listen(port = 0, host = "127.0.0.1") {
      if (host !== "127.0.0.1" && !options.origin)
        throw new Error(
          "Non-loopback binding requires an explicit APP_ORIGIN.",
        );
      if (options.origin) {
        const configured = new URL(options.origin);
        if (
          !["http:", "https:"].includes(configured.protocol) ||
          configured.origin !== options.origin
        )
          throw new Error("APP_ORIGIN must be a plain HTTP(S) origin.");
      }
      if (options.seed !== false)
        for (const scenario of [
          "checkout-null",
          "checkout-null",
          "checkout-null",
          "inventory-timeout",
          "inventory-timeout",
          "payment-unavailable",
        ] as const)
          await telemetry.capture(scenario, "sandbox@1.4.0");
      await new Promise<void>((done, reject) => {
        server.once("error", reject);
        server.listen(port, host, () => {
          server.off("error", reject);
          done();
        });
      });
      const address = server.address();
      if (!address || typeof address === "string")
        throw new Error("No listening address.");
      origin = options.origin ?? `http://127.0.0.1:${address.port}`;
      return origin;
    },
    async close() {
      if (server.listening)
        await new Promise<void>((done, reject) => {
          server.close((error) => (error ? reject(error) : done()));
          server.closeAllConnections();
        });
      await telemetry.close();
    },
  };
}
