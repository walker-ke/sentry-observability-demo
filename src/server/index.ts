import { createDemoServer } from "./http.js";
const port = Number(process.env.PORT ?? 8130);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("PORT must be an integer between 1024 and 65535.");
const app = createDemoServer({ origin: process.env.APP_ORIGIN });
console.log(
  `Signal Room is ready at ${await app.listen(port, process.env.HOST ?? "127.0.0.1")}. Local-only transport; no telemetry uploads.`,
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.once(signal, () => {
    void app.close().then(() => process.exit(0));
  });
