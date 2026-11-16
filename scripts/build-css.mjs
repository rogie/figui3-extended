import { mkdirSync, writeFileSync } from "node:fs";
import { bundle } from "lightningcss";
import { cssArtifacts, NOTICE } from "./artifacts.mjs";

mkdirSync("dist", { recursive: true });

for (const job of cssArtifacts) {
  const result = bundle({
    filename: job.input,
    minify: true,
    drafts: { nesting: true },
  });
  const notice = `/*! ${NOTICE.join(" | ")} */\n`;
  const imports = (job.imports ?? [])
    .map((specifier) => `@import url("${specifier}");`)
    .join("\n");
  const output = `${notice}${imports}${imports ? "\n" : ""}${result.code}`;
  writeFileSync(`dist/${job.output}`, output);
  console.log(`dist/${job.output} ${Buffer.byteLength(output)} bytes`);
}
