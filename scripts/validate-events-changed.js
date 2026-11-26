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

function getDiffRange() {
  const baseRef = process.env.GITHUB_BASE_REF;
  if (!baseRef) {
    return "HEAD~1...HEAD";
  }
  try {
    run(`git rev-parse --verify --quiet origin/${baseRef}`);
    return `origin/${baseRef}...HEAD`;
  } catch (_error) {
    return "HEAD~1...HEAD";
  }
}

function shouldRunForPath(filePath) {
  return [
    /^src\/controllers\//,
    /^src\/core\/trigger-manifest\.js$/,
    /^src\/core\/world-anchor-registry\.js$/,
    /^src\/core\/interaction-rule-registry\.js$/,
    /^tests\/.*(event|trigger|edge|overlap|sequence).*\.test\.js$/,
    /^assets\//,
  ].some((pattern) => pattern.test(filePath));
}

function getChangedEventFiles() {
  if (process.argv.includes("--force")) {
    return ["--forced--"];
  }
  const range = getDiffRange();
  let output = "";
  try {
    output = run(`git diff --name-only --diff-filter=ACMR ${range}`);
  } catch (_error) {
    output = "";
  }
  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((filePath) => shouldRunForPath(filePath));
}

function main() {
  const changedFiles = getChangedEventFiles();
  if (changedFiles.length === 0) {
    console.log("No gameplay-event trigger changes detected. Skipping gameplay-event regression suite.");
    return;
  }

  console.log(`Detected ${changedFiles.length} gameplay-event related file change(s):`);
  changedFiles.forEach((file) => console.log(`- ${file}`));

  runStep("npm run validate:events", "Gameplay event static validation");
  runStep("npm run validate:events:matrix", "Gameplay event deterministic matrix");
}

main();
