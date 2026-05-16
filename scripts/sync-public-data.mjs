import { copyFile, mkdir, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const dataDir = resolve("data");
const publicDataDir = resolve("public/data");

await mkdir(publicDataDir, { recursive: true });

const source = resolve(dataDir, "bracket.json");
await copyFile(source, resolve(publicDataDir, "bracket.json"));
await copyFile(source, resolve(publicDataDir, "bracket-2026.json"));
await copyFile(resolve(dataDir, "distilleries.json"), resolve(publicDataDir, "distilleries.json"));

const generatedBracketFiles = (await readdir(dataDir)).filter((name) => /^bracket-\d{4}\.json$/.test(name));
for (const file of generatedBracketFiles) {
  await copyFile(resolve(dataDir, file), resolve(publicDataDir, file));
}
