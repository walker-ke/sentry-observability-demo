import { randomUUID } from "node:crypto";
import type { ErrorEvent } from "@sentry/node";
import { RELEASES, type Release, type SafeEvent } from "../shared.js";
import { getScenario } from "./scenarios.js";

/** Rebuild the event rather than trying to blacklist every sensitive field. */
export function sanitizeEvent(event: ErrorEvent): ErrorEvent | null {
  const scenario = getScenario(event.tags?.scenario_id);
  const release = event.tags?.release_id ?? event.release;
  if (!scenario || !RELEASES.includes(release as Release)) return null;
  const frames =
    event.exception?.values?.flatMap(
      (value) => value.stacktrace?.frames ?? [],
    ) ?? [];
  const frame = frames.find((value) =>
    value.function?.includes(scenario.functionName),
  );
  return {
    type: undefined,
    event_id: /^[a-f0-9]{32}$/.test(event.event_id ?? "")
      ? event.event_id
      : randomUUID().replaceAll("-", ""),
    timestamp:
      typeof event.timestamp === "number" && Number.isFinite(event.timestamp)
        ? event.timestamp
        : Date.now() / 1000,
    platform: "node",
    environment: "synthetic-demo",
    release: release as Release,
    level: scenario.level,
    fingerprint: ["signal-room", scenario.id],
    tags: { scenario_id: scenario.id, service: scenario.service },
    exception: {
      values: [
        {
          type: scenario.type,
          value: scenario.message,
          stacktrace: {
            frames: [
              {
                filename: "demo/scenarios.ts",
                function: scenario.functionName,
                lineno:
                  frame &&
                  Number.isInteger(frame.lineno) &&
                  frame.lineno! > 0 &&
                  frame.lineno! < 10000
                    ? frame.lineno
                    : scenario.line,
                in_app: true,
              },
            ],
          },
        },
      ],
    },
  };
}

/** Project again at the transport boundary. No raw envelope is retained. */
export function toSafeEvent(value: unknown): SafeEvent | null {
  if (!value || typeof value !== "object") return null;
  const event = sanitizeEvent(value as ErrorEvent);
  if (!event) return null;
  const scenario = getScenario(event.tags?.scenario_id)!;
  return {
    id: event.event_id!,
    scenario: scenario.id,
    timestamp: event.timestamp as number,
    release: event.release as Release,
    type: scenario.type,
    message: scenario.message,
    level: scenario.level,
    service: scenario.service,
    frame: {
      filename: "demo/scenarios.ts",
      function: scenario.functionName,
      line: event.exception!.values![0]!.stacktrace!.frames![0]!.lineno!,
    },
  };
}
