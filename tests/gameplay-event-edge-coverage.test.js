const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("event matrix command includes canvas-edge and object-state coverage tests", () => {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const matrixCommand = packageJson.scripts["validate:events:matrix"] || "";

  assert.equal(matrixCommand.includes("tests/friend-edge-drag.test.js"), true);
  assert.equal(matrixCommand.includes("tests/friend-overlap-helper.test.js"), true);
  assert.equal(matrixCommand.includes("tests/inventory-direct-drop-resolver.test.js"), true);
  assert.equal(matrixCommand.includes("tests/gameplay-event-browser-matrix.test.js"), true);
  assert.equal(matrixCommand.includes("tests/gameplay-event-capture.test.js"), true);
});
