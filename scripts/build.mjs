import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist/public", { recursive: true });
await build({
  entryPoints: ["src/server/index.ts"],
  outfile: "dist/server/index.js",
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  packages: "external",
  sourcemap: false,
});
await build({
  entryPoints: ["src/client/main.ts"],
  outfile: "dist/public/client.js",
  bundle: true,
  platform: "browser",
  target: "es2022",
  format: "esm",
  minify: true,
  sourcemap: false,
});
await cp("src/client/index.html", "dist/public/index.html");
await cp("src/client/styles.css", "dist/public/styles.css");
console.log("Built server and local browser assets.");
