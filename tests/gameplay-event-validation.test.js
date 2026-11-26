const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { validate } = require("../scripts/validate-events-static");

test("static gameplay-event validation passes for trigger manifest and anchors", () => {
  const result = validate();
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.ok(result.triggerCount > 0);
  assert.ok(result.worldCount > 0);
});

test("package scripts include gameplay-event validation commands", () => {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  assert.equal(packageJson.scripts["validate:events"], "node scripts/validate-events-static.js");
  assert.equal(Boolean(packageJson.scripts["validate:events:matrix"]), true);
  assert.equal(Boolean(packageJson.scripts["validate:events:full"]), true);
  assert.equal(Boolean(packageJson.scripts["validate:events:changed"]), true);
});
