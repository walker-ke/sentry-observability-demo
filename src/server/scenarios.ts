import type { DemoScenario, ScenarioId } from "../shared.js";

export const SCENARIOS: DemoScenario[] = [
  {
    id: "checkout-null",
    title: "Checkout total is missing",
    type: "TypeError",
    message: "Cannot read properties of undefined (reading 'total')",
    functionName: "submitOrder",
    service: "checkout-api",
    level: "error",
    description:
      "A missing cart reaches the checkout handler. Capture the exception and inspect its safe stack frame.",
    source: [
      "function submitOrder() {",
      "  const cart = undefined;",
      "  return cart.total;",
      "}",
    ],
    line: 3,
  },
  {
    id: "inventory-timeout",
    title: "Inventory request timed out",
    type: "TimeoutError",
    message: "Sandbox inventory lookup exceeded 2500ms",
    functionName: "fetchInventory",
    service: "inventory-api",
    level: "error",
    description:
      "Simulate an inventory timeout. No actual inventory server or network request is involved.",
    source: [
      "function fetchInventory() {",
      "  const deadline = 2500;",
      "  throw new TimeoutError(deadline);",
      "}",
    ],
    line: 3,
  },
  {
    id: "payment-unavailable",
    title: "Payment sandbox unavailable",
    type: "SandboxPaymentError",
    message: "Fictional payment provider is temporarily unavailable",
    functionName: "authorizePayment",
    service: "payments-api",
    level: "warning",
    description:
      "Capture a handled payment failure. This is a fictional scenario; no payment is sent.",
    source: [
      "function authorizePayment() {",
      "  // A fictional provider response.",
      "  throw new SandboxPaymentError();",
      "}",
    ],
    line: 3,
  },
];
export function getScenario(value: unknown): DemoScenario | undefined {
  return SCENARIOS.find((item) => item.id === value);
}
function submitOrder(): never {
  const cart = undefined;
  return (cart as unknown as { total: never }).total;
}
function fetchInventory(): never {
  const error = new Error("Sandbox inventory lookup exceeded 2500ms");
  error.name = "TimeoutError";
  throw error;
}
function authorizePayment(): never {
  const error = new Error(
    "Fictional payment provider is temporarily unavailable",
  );
  error.name = "SandboxPaymentError";
  throw error;
}
export function throwScenario(id: ScenarioId): never {
  if (id === "checkout-null") return submitOrder();
  if (id === "inventory-timeout") return fetchInventory();
  return authorizePayment();
}
