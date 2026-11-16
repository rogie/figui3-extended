import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { jsArtifacts, NOTICE } from "./artifacts.mjs";

mkdirSync("dist", { recursive: true });
for (const { output } of jsArtifacts) {
  rmSync(join("dist", output), { force: true });
}

for (const job of jsArtifacts) {
  const result = await Bun.build({
    entrypoints: [job.input],
    outdir: "dist",
    minify: true,
    external: ["@rogieking/figui3", "@rogieking/figui3/*"],
    naming: job.output,
    banner: `/*! ${NOTICE.join(" | ")} */`,
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }
  for (const output of result.outputs) {
    console.log(`${output.path} ${output.size} bytes`);
  }
}
