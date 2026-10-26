import type { Transport } from "@sentry/core";
import { toSafeEvent } from "./privacy.js";
import type { IssueStore } from "./store.js";

/** A protocol sink, not a network transport. Headers and unsupported items are not retained. */
export function createLocalTransport(store: IssueStore): Transport {
  return {
    send: async (envelope) => {
      for (const [header, payload] of envelope[1]) {
        if (header.type !== "event") continue;
        const safe = toSafeEvent(payload);
        if (safe) store.add(safe);
      }
      return { statusCode: 200 };
    },
    flush: async () => true,
  };
}
