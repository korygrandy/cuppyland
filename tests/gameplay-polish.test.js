const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("cup and lid polish sources contain drag, snap, and boundary behavior", () => {
  const styles = fs.readFileSync("styles.css", "utf8");
  const cupPointer = fs.readFileSync("src/controllers/cup-pointer-controller.js", "utf8");
  const inventory = fs.readFileSync("src/controllers/inventory-interaction-controller.js", "utf8");
  const rules = fs.readFileSync("src/controllers/game-rules-controller.js", "utf8");

  assert.equal(styles.includes(".cup-character.lid-detached"), true);
  assert.equal(cupPointer.includes("nowMs - lastTapAt <= 300"), true);
  assert.equal(cupPointer.includes("atWorldLeft || atWorldRight"), true);
  assert.equal(inventory.includes('if (target.dataset.itemType === "cup-create")'), false);
  assert.equal(inventory.includes('dragState.type === "cup-create"'), true);
  assert.equal(rules.includes("lid-already-snapped"), true);
  assert.equal(rules.includes("lidDetached = false"), true);
});

test("water, puppy, and toy interactions are registered", () => {
  const app = fs.readFileSync("src/core/app.js", "utf8");
  const pointer = fs.readFileSync("src/controllers/friend-pointer-controller.js", "utf8");
  const inventory = fs.readFileSync("src/controllers/inventory-interaction-controller.js", "utf8");
  const config = fs.readFileSync("src/core/game-config.js", "utf8");
  const ui = fs.readFileSync("src/ui/inventory.js", "utf8");

  assert.equal(app.includes("onDirectWaterSource"), true);
  assert.equal(pointer.includes("onDirectPuppyToBed"), true);
  assert.equal(pointer.includes("onDirectWaterSource"), true);
  assert.equal(inventory.includes('dragState.value === "fishbowl" || dragState.value === "water-bottle"'), true);
  assert.equal(config.includes('"water-bottle"'), true);
  assert.equal(ui.includes('"water-bottle"'), true);
});
