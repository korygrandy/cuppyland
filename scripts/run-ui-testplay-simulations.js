const fs = require("node:fs");
const path = require("node:path");

function createRng(seed) {
  let state = (Number(seed) >>> 0) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const simulationTemplates = [
  { id: "trampoline-bounce", type: "hitbox", successRate: 0.93, edgeSensitive: true, sequence: false },
  { id: "bed-bounce", type: "hitbox", successRate: 0.91, edgeSensitive: true, sequence: false },
  { id: "tube-slide-sequence", type: "sequence", successRate: 0.88, edgeSensitive: false, sequence: true },
  { id: "merry-go-round-activation", type: "hitbox", successRate: 0.9, edgeSensitive: false, sequence: false },
  { id: "fishbowl-water-bowl-drop", type: "object-object", successRate: 0.87, edgeSensitive: false, sequence: false },
  { id: "dogfood-dogbowl-drop", type: "object-object", successRate: 0.9, edgeSensitive: false, sequence: false },
  { id: "parmesan-double-tap", type: "double-tap", successRate: 0.94, edgeSensitive: false, sequence: true },
  { id: "ukulele-double-tap", type: "double-tap", successRate: 0.92, edgeSensitive: false, sequence: true },
  { id: "canvas-edge-clamp", type: "edge", successRate: 0.85, edgeSensitive: true, sequence: false },
  { id: "out-of-bounds-removal", type: "edge", successRate: 0.89, edgeSensitive: true, sequence: false },
  { id: "inventory-direct-drop", type: "object-state", successRate: 0.91, edgeSensitive: false, sequence: false },
  { id: "duplicate-trigger-guard", type: "guard", successRate: 0.9, edgeSensitive: false, sequence: false },
];

function clamp(min, max, value) {
  return Math.max(min, Math.min(max, value));
}

function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pickTemplate(rng) {
  return simulationTemplates[randomInt(rng, 0, simulationTemplates.length - 1)];
}

function runSimulation(options = {}) {
  const seed = Number(options.seed ?? 20261126);
  const playerCount = clamp(1, 500, Number(options.playerCount ?? 100));
  const rng = createRng(seed);
  const startedAt = new Date().toISOString();
  const simulations = [];
  const eventTypeTotals = {};
  const eventTotals = {};
  const failuresByEvent = {};

  for (let playerIndex = 0; playerIndex < playerCount; playerIndex += 1) {
    const traceLength = randomInt(rng, 10, 24);
    const trace = [];
    let successCount = 0;
    let failureCount = 0;

    for (let stepIndex = 0; stepIndex < traceLength; stepIndex += 1) {
      const template = pickTemplate(rng);
      const edgePenalty = template.edgeSensitive && rng() < 0.25 ? 0.08 : 0;
      const successRate = clamp(0, 1, template.successRate - edgePenalty);
      const succeeded = rng() <= successRate;
      const event = {
        step: stepIndex + 1,
        eventId: template.id,
        eventType: template.type,
        sequence: template.sequence,
        edgeScenario: template.edgeSensitive && edgePenalty > 0,
        outcome: succeeded ? "success" : "failure",
      };
      trace.push(event);

      eventTypeTotals[template.type] = (eventTypeTotals[template.type] || 0) + 1;
      eventTotals[template.id] = (eventTotals[template.id] || 0) + 1;
      if (!succeeded) {
        failuresByEvent[template.id] = (failuresByEvent[template.id] || 0) + 1;
      }
      if (succeeded) {
        successCount += 1;
      } else {
        failureCount += 1;
      }
    }

    simulations.push({
      simulationId: `player-${String(playerIndex + 1).padStart(3, "0")}`,
      playerProfile: {
        buildStyle: ["decorator", "trigger-heavy", "balanced"][randomInt(rng, 0, 2)],
        sessionIntensity: ["light", "normal", "heavy"][randomInt(rng, 0, 2)],
      },
      traceLength,
      successCount,
      failureCount,
      trace,
    });
  }

  const riskLog = Object.entries(failuresByEvent)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([eventId, failureCount], index) => {
      const total = eventTotals[eventId] || 1;
      const failureRate = failureCount / total;
      const severity = failureRate >= 0.2 ? "high" : failureRate >= 0.12 ? "medium" : "low";
      return {
        riskId: `risk-${index + 1}`,
        eventId,
        severity,
        failureCount,
        totalRuns: total,
        failureRate: Number(failureRate.toFixed(4)),
        recommendation: severity === "high"
          ? "Add deterministic regression coverage and investigate trigger-state race conditions."
          : severity === "medium"
            ? "Add targeted replay and edge-state assertions."
            : "Monitor trend in next cycle.",
      };
    });

  const summary = {
    seed,
    playerCount,
    totalEvents: simulations.reduce((sum, simulation) => sum + simulation.traceLength, 0),
    totalSuccesses: simulations.reduce((sum, simulation) => sum + simulation.successCount, 0),
    totalFailures: simulations.reduce((sum, simulation) => sum + simulation.failureCount, 0),
    eventTypeTotals,
    topEventTotals: Object.entries(eventTotals)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([eventId, count]) => ({ eventId, count })),
    risks: riskLog,
  };

  return {
    metadata: {
      generatedAt: startedAt,
      tool: "ui-testplay-simulations",
      version: 1,
    },
    summary,
    simulations,
  };
}

function buildHtmlDashboard(report) {
  const escape = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  const riskRows = report.summary.risks.map((risk) => `
      <tr>
        <td>${escape(risk.riskId)}</td>
        <td>${escape(risk.eventId)}</td>
        <td>${escape(risk.severity)}</td>
        <td>${escape(risk.failureCount)}</td>
        <td>${escape(risk.totalRuns)}</td>
        <td>${escape(risk.failureRate)}</td>
        <td>${escape(risk.recommendation)}</td>
      </tr>`).join("");

  const eventRows = report.summary.topEventTotals.map((eventTotal) => `
      <tr>
        <td>${escape(eventTotal.eventId)}</td>
        <td>${escape(eventTotal.count)}</td>
      </tr>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>UI Testplay Simulation Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #1f2937; }
    h1, h2 { margin-bottom: 8px; }
    .meta { margin-bottom: 16px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; }
    .sev-high { color: #b91c1c; font-weight: 700; }
    .sev-medium { color: #b45309; font-weight: 700; }
    .sev-low { color: #065f46; font-weight: 700; }
  </style>
</head>
<body>
  <h1>UI Testplay Simulation Dashboard</h1>
  <div class="meta">
    <div><strong>Seed:</strong> ${escape(report.summary.seed)}</div>
    <div><strong>Players:</strong> ${escape(report.summary.playerCount)}</div>
    <div><strong>Total events:</strong> ${escape(report.summary.totalEvents)}</div>
    <div><strong>Total failures:</strong> ${escape(report.summary.totalFailures)}</div>
  </div>
  <h2>Top Event Totals</h2>
  <table>
    <thead><tr><th>Event</th><th>Count</th></tr></thead>
    <tbody>${eventRows}</tbody>
  </table>
  <h2>Risk Log</h2>
  <table>
    <thead>
      <tr><th>Risk ID</th><th>Event</th><th>Severity</th><th>Failures</th><th>Total Runs</th><th>Rate</th><th>Recommendation</th></tr>
    </thead>
    <tbody>${riskRows}</tbody>
  </table>
</body>
</html>`;
}

function writeSimulationArtifacts(report, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, "simulation-report.json");
  const htmlPath = path.join(outputDir, "simulation-dashboard.html");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(htmlPath, buildHtmlDashboard(report));
  return { jsonPath, htmlPath };
}

function parseArg(name, fallback) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

if (require.main === module) {
  const playerCount = Number(parseArg("players", 100));
  const seed = Number(parseArg("seed", 20261126));
  const outputDir = parseArg(
    "output",
    path.resolve(__dirname, "..", "reports", "ui-testplay-simulations", "latest")
  );
  const report = runSimulation({ playerCount, seed });
  const files = writeSimulationArtifacts(report, outputDir);
  console.log(`Generated UI testplay simulation report for ${report.summary.playerCount} players.`);
  console.log(`JSON: ${files.jsonPath}`);
  console.log(`HTML: ${files.htmlPath}`);
}

module.exports = {
  runSimulation,
  writeSimulationArtifacts,
  buildHtmlDashboard,
};
