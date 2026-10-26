import type { Issue, IssueStatus, SafeEvent } from "../shared.js";
import { getScenario } from "./scenarios.js";

export class IssueStore {
  readonly maxEvents = 200;
  private issues = new Map<string, Issue>();
  private events: SafeEvent[] = [];
  totalCaptured = 0;
  startedAt = Date.now();
  add(event: SafeEvent): void {
    if (this.events.some((item) => item.id === event.id)) return;
    const definition = getScenario(event.scenario);
    if (!definition) return;
    const id =
      "LAB-" +
      (1001 +
        ["checkout-null", "inventory-timeout", "payment-unavailable"].indexOf(
          event.scenario,
        ));
    const issue = this.issues.get(id) ?? {
      id,
      scenario: event.scenario,
      title: definition.title,
      type: event.type,
      level: event.level,
      service: event.service,
      status: "open",
      count: 0,
      firstSeen: event.timestamp,
      lastSeen: event.timestamp,
      releases: [],
      events: [],
    };
    if (issue.status === "resolved") issue.status = "regressed";
    issue.count++;
    issue.lastSeen = event.timestamp;
    if (!issue.releases.includes(event.release))
      issue.releases.push(event.release);
    issue.events = [event, ...issue.events].slice(0, 20);
    this.issues.set(id, issue);
    this.events = [event, ...this.events].slice(0, this.maxEvents);
    this.totalCaptured++;
  }
  setStatus(
    id: string,
    status: Extract<IssueStatus, "open" | "resolved">,
  ): boolean {
    const issue = this.issues.get(id);
    if (!issue) return false;
    issue.status = status;
    return true;
  }
  reset(): void {
    this.issues.clear();
    this.events = [];
    this.totalCaptured = 0;
    this.startedAt = Date.now();
  }
  snapshot() {
    return structuredClone({
      issues: [...this.issues.values()].sort((a, b) => b.lastSeen - a.lastSeen),
      events: this.events,
      totalCaptured: this.totalCaptured,
      maxEvents: this.maxEvents,
      startedAt: this.startedAt,
    });
  }
}
