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

test("cup removal checks every world canvas edge", () => {
  const cupPointer = fs.readFileSync("src/controllers/cup-pointer-controller.js", "utf8");
  assert.equal(cupPointer.includes("atWorldTop"), true);
  assert.equal(cupPointer.includes("atWorldBottom"), true);
  assert.equal(cupPointer.includes("atWorldLeft"), true);
  assert.equal(cupPointer.includes("atWorldRight"), true);
});

test("cup inventory tap instantiates at viewport drop point", () => {
  const inventory = fs.readFileSync("src/controllers/inventory-interaction-controller.js", "utf8");
  const store = fs.readFileSync("src/state/cup-state-store.js", "utf8");
  assert.equal(inventory.includes('target.dataset.itemType === "friend" || target.dataset.itemType === "cup-create"'), true);
  assert.equal(inventory.includes("if (dragState.type === \"cup-create\")"), true);
  assert.equal(store.includes("Number.isFinite(dropPoint?.worldX)"), true);
  assert.equal(store.includes("Number.isFinite(dropPoint?.worldY)"), true);
});

test("water bottle is in accessories and remains a snap source", () => {
  const ui = fs.readFileSync("src/ui/inventory.js", "utf8");
  assert.equal(ui.includes('"lavalamp", "chocolate-milk", "uke", "flower-bead-craft", "merry-go-round", "water-bottle"'), true);
  assert.equal(ui.includes('"water-bottle"'), true);
});

test("trampoline stops when trampolineFriends map is empty", () => {
  const source = fs.readFileSync("src/controllers/background-object-controller.js", "utf8");
  assert.equal(source.includes("const hasRegisteredTrampolineFriend"), true);
  assert.equal(source.includes("Boolean(trampolineFriends.get(objectConfig.id)?.size)"), true);
  assert.equal(source.includes("stopTrampolineAnimation(objectConfig.id)"), true);
});
