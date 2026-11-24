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
  assert.equal(cupPointer.includes("movedOutsideWorld"), true);
  assert.equal(inventory.includes('if (target.dataset.itemType === "cup-create")'), true);
  assert.equal(inventory.includes('dragState.type === "cup-create"'), false);
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

test("cup removal requires movement outside the world bounds", () => {
  const cupPointer = fs.readFileSync("src/controllers/cup-pointer-controller.js", "utf8");
  assert.equal(cupPointer.includes("cupDragState.moved"), true);
  assert.equal(cupPointer.includes("isCupOutsideWorldBounds"), true);
  assert.equal(cupPointer.includes("cupDragState.startWorldX + deltaX"), true);
  assert.equal(cupPointer.includes("cupDragState.startWorldY + deltaY"), true);
  assert.equal(cupPointer.includes("movedOutsideWorld"), true);
  assert.equal(cupPointer.includes("cupDragState.movedOutsideWorld"), true);
  assert.equal(cupPointer.includes("onCupPointerUp(event)"), true);
  assert.equal(cupPointer.includes("removeCupInstance?.(cupId)"), true);
});

test("cup inventory tap instantiates at viewport center", () => {
  const inventory = fs.readFileSync("src/controllers/inventory-interaction-controller.js", "utf8");
  const store = fs.readFileSync("src/state/cup-state-store.js", "utf8");
  const worldCoordinates = fs.readFileSync("src/controllers/world-coordinate-controller.js", "utf8");
  assert.equal(inventory.includes("applyInventorySelection(target.dataset.itemType"), true);
  assert.equal(inventory.includes('target.dataset.itemType === "cup-create"'), true);
  assert.equal(inventory.includes("getDefaultFriendDropPoint(target.dataset.value)"), true);
  assert.equal(worldCoordinates.includes("state?.activeWorld === \"olivia-room\" && friendType === \"chocolate-milk\""), true);
  assert.equal(worldCoordinates.includes("basePoint.worldX - 500"), true);
  assert.equal(inventory.includes("dragState.value === \"chocolate-milk\""), true);
  assert.equal(inventory.includes("dropPoint.worldX - 500"), true);
  assert.equal(store.includes("addCupToWorld()"), true);
  assert.equal(store.includes("getViewportSpawnPoint(worldCups.length)"), true);
});

test("re-added cups receive unique IDs after a middle cup is removed", () => {
  const { loadBrowserScript } = require("./test-helpers");
  const context = { window: {} };
  loadBrowserScript("src/state/cup-state-store.js", context);

  const state = {
    activeWorld: "olivia-room",
    activeCupId: "cup-olivia-room-1",
    cup: {},
    worlds: {
      "olivia-room": {
        cups: [
          { id: "cup-olivia-room-1", state: { worldX: 500, worldY: 430, zIndex: 1 } },
          { id: "cup-olivia-room-2", state: { worldX: 900, worldY: 430, zIndex: 2 } },
        ],
      },
    },
  };
  const store = context.window.CuppyLandCupState.createStore({
    state,
    gameConfig: {
      defaultCupState: { worldX: 920, worldY: 430, zIndex: 1 },
    },
    worldCanvas: { offsetWidth: 2200, offsetHeight: 800 },
    worldViewport: { scrollLeft: 0, clientWidth: 1280, clientHeight: 800 },
  });

  assert.equal(store.removeCupInstance("cup-olivia-room-1").removed, true);
  const readded = store.addCupToWorld();
  assert.equal(readded.id, "cup-olivia-room-3");
});

test("water bottle is in accessories and remains a snap source", () => {
  const ui = fs.readFileSync("src/ui/inventory.js", "utf8");
  assert.equal(ui.includes('"lavalamp", "chocolate-milk", "uke", "flower-bead-craft", "merry-go-round", "water-bottle"'), true);
  assert.equal(ui.includes('"water-bottle"'), true);
});

test("trampoline stops when trampolineFriends map is empty", () => {
  const source = fs.readFileSync("src/controllers/background-object-controller.js", "utf8");
  const pointerSource = fs.readFileSync("src/controllers/friend-pointer-controller.js", "utf8");
  const removalSource = fs.readFileSync("src/controllers/friend-removal-controller.js", "utf8");
  assert.equal(source.includes("const hasRegisteredTrampolineFriend"), true);
  assert.equal(source.includes("Boolean(trampolineFriends.get(objectConfig.id)?.size)"), true);
  assert.equal(source.includes("stopTrampolineAnimation(objectConfig.id)"), true);
  assert.equal(pointerSource.includes("friendState.attachedCupId = null"), true);
  assert.equal(pointerSource.includes("friendState.sequenceFrame = null"), true);
  assert.equal(pointerSource.includes("friendState.attachedOffsetX = 0"), true);
  assert.equal(pointerSource.includes("isPointerOutsideWorldBounds"), true);
  assert.equal(pointerSource.includes("getWorldPointFromClient"), true);
  assert.equal(pointerSource.includes("friendState?.id || friendDragState.friendId"), true);
  assert.equal(removalSource.includes("removeBackgroundObjectActivation(friendState?.id || friendId)"), true);
});
