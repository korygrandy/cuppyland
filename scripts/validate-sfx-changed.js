const { execSync, spawnSync } = require("node:child_process");

function run(command) {
  return execSync(command, { encoding: "utf8" }).trim();
}

function runStep(command, label) {
  const result = spawnSync(command, {
    shell: true,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    console.error(`${label} failed with exit code ${result.status}.`);
    process.exit(result.status || 1);
  }
}

function getChangedSfxFiles() {
  const force = process.argv.includes("--force");
  if (force) {
    return ["--forced--"];
  }

  const baseRef = process.env.GITHUB_BASE_REF;
  let range = "HEAD~1...HEAD";
  if (baseRef) {
    try {
      run(`git rev-parse --verify --quiet origin/${baseRef}`);
      range = `origin/${baseRef}...HEAD`;
    } catch (_error) {
      range = "HEAD~1...HEAD";
    }
  }

  let output = "";
  try {
    output = run(`git diff --name-only --diff-filter=ACMR ${range} -- sfx`);
  } catch (_error) {
    output = "";
  }
  if (!output) {
    return [];
  }
  return output.split(/\r?\n/).filter(Boolean);
}

function main() {
  const changedSfxFiles = getChangedSfxFiles();
  if (changedSfxFiles.length === 0) {
    console.log("No SFX file changes detected under sfx/. Skipping SFX regression suite.");
    return;
  }

  console.log(`Detected ${changedSfxFiles.length} changed SFX file(s):`);
  changedSfxFiles.forEach((file) => console.log(`- ${file}`));

  runStep("npm run validate:sfx", "Static SFX validation");
  runStep("npm run validate:sfx:matrix", "Deterministic SFX matrix");
}

main();
