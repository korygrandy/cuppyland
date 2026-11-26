const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { validate } = require("../scripts/validate-sfx-static");

test("static SFX manifest validation passes without missing files or direct clip references", () => {
  const result = validate();
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.ok(result.clipCount > 0);
  assert.ok(result.directReferenceCount > 0);
});

test("SFX validation script is wired into package commands", () => {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  assert.equal(packageJson.scripts["validate:sfx"], "node scripts/validate-sfx-static.js");
});
