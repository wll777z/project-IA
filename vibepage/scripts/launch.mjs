import { readFile } from "node:fs/promises";
import { validateProductionEnv } from "./production-env.mjs";
import { validateBuildOrigin } from "./build-origin.mjs";
const { origin } = validateProductionEnv(process.env);
let manifest;
try {
  manifest = JSON.parse(
    await readFile(new URL("./build-origin.json", import.meta.url), "utf8"),
  );
} catch {
  throw new Error(
    "Manifesto de origem ausente/inválido; execute npm run build novamente.",
  );
}
validateBuildOrigin(origin, manifest);
await import("./server.js");
