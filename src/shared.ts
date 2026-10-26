export type ScenarioId =
  "checkout-null" | "inventory-timeout" | "payment-unavailable";
export type Release = "sandbox@1.4.0" | "sandbox@1.4.1";
export type IssueStatus = "open" | "resolved" | "regressed";
export type Level = "error" | "warning";
export interface DemoScenario {
  id: ScenarioId;
  title: string;
  type: string;
  message: string;
  functionName: string;
  service: string;
  level: Level;
  description: string;
  source: string[];
  line: number;
}
export interface SafeEvent {
  id: string;
  scenario: ScenarioId;
  timestamp: number;
  release: Release;
  type: string;
  message: string;
  level: Level;
  service: string;
  frame: { filename: string; function: string; line: number };
}
export interface Issue {
  id: string;
  scenario: ScenarioId;
  title: string;
  type: string;
  level: Level;
  service: string;
  status: IssueStatus;
  count: number;
  firstSeen: number;
  lastSeen: number;
  releases: Release[];
  events: SafeEvent[];
}
export interface LabState {
  issues: Issue[];
  events: SafeEvent[];
  scenarios: DemoScenario[];
  sdkVersion: string;
  mode: "local-only";
  totalCaptured: number;
  maxEvents: number;
  startedAt: number;
}
export const RELEASES: Release[] = ["sandbox@1.4.0", "sandbox@1.4.1"];
