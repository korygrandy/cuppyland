const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { buildTestPlan, runManagedCycle, writeManagerArtifacts } = require("../scripts/test-manager");

test("test manager builds scoped plan from changed files", () => {
  const plan = buildTestPlan({
    changedFiles: [
      "sfx/hi.ogg",
      "src/controllers/tube-slide-controller.js",
      ".github/skills/sfx-validation/SKILL.md",
    ],
  });
  assert.equal(plan.hasSfxChange, true);
  assert.equal(plan.hasEventChange, true);
  assert.equal(plan.includesInfra, true);
  assert.equal(plan.commands.includes("npm run validate:sfx:changed -- --force"), true);
  assert.equal(plan.commands.includes("npm run validate:events:changed -- --force"), true);
});

test("test manager run cycle produces report with simulation artifacts and risks", () => {
  const { report } = runManagedCycle({
    execute: false,
    simulationPlayers: 20,
    simulationSeed: 9001,
    changedFiles: ["src/controllers/friend-pointer-controller.js"],
  });
  assert.equal(Array.isArray(report.commandResults), true);
  assert.equal(Array.isArray(report.risks), true);
  assert.ok(report.risks.length > 0);
  assert.ok(typeof report.simulationArtifacts?.jsonPath === "string");
});

test("test manager can write JSON and HTML manager artifacts", () => {
  const sampleReport = {
    metadata: { generatedAt: new Date().toISOString() },
    plan: { changedFiles: [] },
    commandResults: [],
    risks: [{ riskId: "risk-1", severity: "low", eventId: "demo", recommendation: "none" }],
  };
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-manager-"));
  const files = writeManagerArtifacts(sampleReport, outputDir);
  assert.equal(fs.existsSync(files.jsonPath), true);
  assert.equal(fs.existsSync(files.htmlPath), true);
  const html = fs.readFileSync(files.htmlPath, "utf8");
  assert.equal(html.includes("Test Manager Dashboard"), true);
});
