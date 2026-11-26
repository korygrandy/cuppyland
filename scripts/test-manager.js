const fs = require("node:fs");
const path = require("node:path");
const { execSync, spawnSync } = require("node:child_process");
const { runSimulation, writeSimulationArtifacts } = require("./run-ui-testplay-simulations");

function run(command) {
  return execSync(command, { encoding: "utf8" }).trim();
}

function runStep(command, label) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, { shell: true, stdio: "inherit" });
  return {
    label,
    command,
    startedAt,
    completedAt: new Date().toISOString(),
    passed: result.status === 0,
    exitCode: result.status,
  };
}

function getChangedFiles() {
  const changedArg = process.argv.find((arg) => arg.startsWith("--changed="));
  if (changedArg) {
    return changedArg.slice("--changed=".length).split(",").filter(Boolean);
  }
  try {
    const output = run("git diff --name-only --diff-filter=ACMR HEAD~1...HEAD");
    return output ? output.split(/\r?\n/).filter(Boolean) : [];
  } catch (_error) {
    return [];
  }
}

function buildTestPlan(options = {}) {
  const changedFiles = options.changedFiles || getChangedFiles();
  const hasSfxChange = changedFiles.some((file) => file.startsWith("sfx/"));
  const hasEventChange = changedFiles.some((file) => (
    file.startsWith("src/controllers/")
    || file === "src/core/trigger-manifest.js"
    || file === "src/core/world-anchor-registry.js"
    || file === "src/core/interaction-rule-registry.js"
    || file.startsWith("assets/")
  ));
  const includesInfra = changedFiles.some((file) => (
    file.startsWith(".github/skills/")
    || file.startsWith(".github/workflows/")
    || file.startsWith("scripts/")
    || file.startsWith("tests/")
  ));

  const commands = [];
  if (hasSfxChange) {
    commands.push("npm run validate:sfx:changed -- --force");
  }
  if (hasEventChange) {
    commands.push("npm run validate:events:changed -- --force");
  }
  if (includesInfra || (!hasSfxChange && !hasEventChange)) {
    commands.push("npm run validate:sfx:matrix");
    commands.push("npm run validate:events:matrix");
  }

  return {
    changedFiles,
    hasSfxChange,
    hasEventChange,
    includesInfra,
    commands: Array.from(new Set(commands)),
    checkpoints: [
      { id: "checkpoint-1", title: "Plan and scope", status: "complete" },
      { id: "checkpoint-2", title: "Simulation pass", status: "pending" },
      { id: "checkpoint-3", title: "Validation execution", status: "pending" },
      { id: "checkpoint-4", title: "Risk review", status: "pending" },
    ],
  };
}

function buildHtmlManagerDashboard(report) {
  const commandRows = report.commandResults.map((entry) => `
      <tr>
        <td>${entry.label}</td>
        <td>${entry.passed ? "pass" : "fail"}</td>
        <td>${entry.exitCode ?? ""}</td>
        <td><code>${entry.command}</code></td>
      </tr>`).join("");

  const riskRows = report.risks.map((risk) => `
      <tr>
        <td>${risk.riskId}</td>
        <td>${risk.severity}</td>
        <td>${risk.eventId}</td>
        <td>${risk.recommendation}</td>
      </tr>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Test Manager Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #111827; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
    th { background: #f3f4f6; }
  </style>
</head>
<body>
  <h1>Test Manager Dashboard</h1>
  <p><strong>Generated:</strong> ${report.metadata.generatedAt}</p>
  <p><strong>Changed files:</strong> ${report.plan.changedFiles.length}</p>
  <h2>Command results</h2>
  <table>
    <thead><tr><th>Label</th><th>Status</th><th>Exit</th><th>Command</th></tr></thead>
    <tbody>${commandRows}</tbody>
  </table>
  <h2>Risk Log</h2>
  <table>
    <thead><tr><th>Risk ID</th><th>Severity</th><th>Event</th><th>Recommendation</th></tr></thead>
    <tbody>${riskRows}</tbody>
  </table>
</body>
</html>`;
}

function writeManagerArtifacts(report, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, "manager-report.json");
  const htmlPath = path.join(outputDir, "manager-dashboard.html");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(htmlPath, buildHtmlManagerDashboard(report));
  return { jsonPath, htmlPath };
}

function runManagedCycle(options = {}) {
  const execute = options.execute === true;
  const simulationPlayers = Number(options.simulationPlayers ?? 100);
  const simulationSeed = Number(options.simulationSeed ?? 20261126);
  const plan = buildTestPlan({ changedFiles: options.changedFiles });
  const commandResults = [];
  if (execute) {
    plan.commands.forEach((command, index) => {
      commandResults.push(runStep(command, `validation-${index + 1}`));
    });
  } else {
    plan.commands.forEach((command, index) => {
      commandResults.push({
        label: `validation-${index + 1}`,
        command,
        startedAt: null,
        completedAt: null,
        passed: null,
        exitCode: null,
      });
    });
  }

  const simulationReport = runSimulation({ playerCount: simulationPlayers, seed: simulationSeed });
  const simulationOutputDir = path.resolve(__dirname, "..", "reports", "ui-testplay-simulations", "latest");
  const simulationArtifacts = writeSimulationArtifacts(simulationReport, simulationOutputDir);

  const risks = [...simulationReport.summary.risks];
  commandResults
    .filter((entry) => entry.passed === false)
    .forEach((entry, index) => {
      risks.push({
        riskId: `manager-failure-${index + 1}`,
        severity: "high",
        eventId: entry.command,
        recommendation: "Fix failed validation command and rerun managed cycle.",
      });
    });

  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      tool: "test-manager",
      execute,
    },
    plan,
    commandResults,
    risks,
    simulationArtifacts,
  };

  const outputDir = path.resolve(__dirname, "..", "reports", "test-manager", "latest");
  const files = writeManagerArtifacts(report, outputDir);
  return { report, files };
}

if (require.main === module) {
  const execute = process.argv.includes("--execute");
  const playersArg = process.argv.find((arg) => arg.startsWith("--players="));
  const seedArg = process.argv.find((arg) => arg.startsWith("--seed="));
  const players = playersArg ? Number(playersArg.slice("--players=".length)) : 100;
  const seed = seedArg ? Number(seedArg.slice("--seed=".length)) : 20261126;
  const result = runManagedCycle({
    execute,
    simulationPlayers: players,
    simulationSeed: seed,
  });
  console.log("Test manager report generated.");
  console.log(`JSON: ${result.files.jsonPath}`);
  console.log(`HTML: ${result.files.htmlPath}`);
}

module.exports = {
  buildTestPlan,
  runManagedCycle,
  writeManagerArtifacts,
  buildHtmlManagerDashboard,
};
