const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { runSimulation, writeSimulationArtifacts } = require("../scripts/run-ui-testplay-simulations");

test("ui testplay simulation is deterministic for fixed seed and player count", () => {
  const a = runSimulation({ seed: 12345, playerCount: 100 });
  const b = runSimulation({ seed: 12345, playerCount: 100 });
  assert.deepEqual(a.summary, b.summary);
  assert.deepEqual(a.simulations, b.simulations);
});

test("ui testplay simulation creates risk log entries and expected counts", () => {
  const report = runSimulation({ seed: 20261126, playerCount: 100 });
  assert.equal(report.summary.playerCount, 100);
  assert.ok(report.summary.totalEvents > 0);
  assert.ok(report.summary.risks.length > 0);
  report.summary.risks.forEach((risk) => {
    assert.ok(["high", "medium", "low"].includes(risk.severity));
    assert.ok(typeof risk.recommendation === "string" && risk.recommendation.length > 0);
  });
});

test("ui testplay simulation writes JSON and HTML artifacts", () => {
  const report = runSimulation({ seed: 7, playerCount: 10 });
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-testplay-"));
  const files = writeSimulationArtifacts(report, outputDir);
  assert.equal(fs.existsSync(files.jsonPath), true);
  assert.equal(fs.existsSync(files.htmlPath), true);
  const html = fs.readFileSync(files.htmlPath, "utf8");
  assert.equal(html.includes("UI Testplay Simulation Dashboard"), true);
});
