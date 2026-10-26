import {
  NodeClient,
  Scope,
  SDK_VERSION,
  defaultStackParser,
} from "@sentry/node";
import type { Release, ScenarioId } from "../shared.js";
import { sanitizeEvent } from "./privacy.js";
import { createLocalTransport } from "./local-transport.js";
import { IssueStore } from "./store.js";
import { throwScenario } from "./scenarios.js";

export function createTelemetry(store: IssueStore) {
  // Reserved invalid domain. The custom transport never uses this URL or a network API.
  // Deliberately ignore environment DSNs and use a standalone client, not global init().
  const client = new NodeClient({
    dsn: "https://synthetic@example.invalid/1",
    integrations: [],
    stackParser: defaultStackParser,
    includeServerName: false,
    enableRuntimeChannelInjection: false,
    enableOpenTelemetrySetup: false,
    sendClientReports: false,
    sampleRate: 1,
    tracesSampleRate: 0,
    debug: false,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      mcp: { inputs: false, outputs: false },
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
      frameContextLines: 0,
    },
    beforeSend: sanitizeEvent,
    transport: () => createLocalTransport(store),
  });
  client.init();
  return {
    sdkVersion: SDK_VERSION,
    async capture(scenario: ScenarioId, release: Release): Promise<string> {
      const scope = new Scope();
      scope.setClient(client);
      scope.setTag("scenario_id", scenario);
      scope.setTag("release_id", release);
      let eventId = "";
      try {
        throwScenario(scenario);
      } catch (error) {
        eventId = scope.captureException(error);
      }
      if (!(await client.flush(2000)))
        throw new Error("The local SDK pipeline did not flush.");
      if (!store.snapshot().events.some((event) => event.id === eventId))
        throw new Error("The local SDK pipeline did not retain the event.");
      return eventId;
    },
    async close() {
      await client.close(2000);
    },
  };
}
