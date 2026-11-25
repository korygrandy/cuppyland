const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("inventory button uses the blue backpack icon", () => {
  const html = fs.readFileSync("index.html", "utf8");
  const styles = fs.readFileSync("styles.css", "utf8");

  assert.equal(html.includes('class="backpack-icon"'), true);
  assert.equal(html.includes("🎒"), false);
  assert.equal(styles.includes(".backpack-icon-body"), true);
  assert.equal(styles.includes("background: #50a7ff"), true);
});

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

test("water bowl double-tap and fountain hitbox activate immediately", () => {
  const pointer = fs.readFileSync("src/controllers/friend-pointer-controller.js", "utf8");
  const app = fs.readFileSync("src/core/app.js", "utf8");
  const background = fs.readFileSync("src/controllers/background-object-controller.js", "utf8");
  const anchor = fs.readFileSync("src/core/world-anchor-registry.js", "utf8");

  assert.equal(pointer.includes('friendState.full = true'), true);
  assert.equal(pointer.includes('syncBackgroundObjectActivation(friendState, friendElement)'), true);
  assert.equal(pointer.includes('playSfxClip?.("drinkingFountainActivated")'), true);
  assert.equal(pointer.includes('fountainAnchor?.find'), false);
  assert.equal(background.includes('isAllowedActivator'), true);
  assert.equal(background.includes('wasActive && !isActive && objectConfig.activatedSfx'), true);
  assert.equal(app.includes("syncBackgroundObjectActivation(bowlState"), true);
  assert.equal(background.includes('anchor?.classList.add("active")'), true);
  assert.equal(background.includes('playSfxClip(objectConfig.activatedSfx'), true);
  assert.equal(anchor.includes('"drinkingFountainActivated"'), true);
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

test("Olivia-room cup starts 200px left of the default bedroom position", () => {
  const gameConfig = fs.readFileSync("src/core/game-config.js", "utf8");
  const cupStore = fs.readFileSync("src/state/cup-state-store.js", "utf8");
  assert.equal(gameConfig.includes("state.worldX = 720"), true);
  assert.equal(cupStore.includes("worldId === \"olivia-room\""), true);
  assert.equal(cupStore.includes("state.worldX = 720"), true);
  assert.equal(cupStore.includes("state?.activeWorld === \"olivia-room\" ? 200 : 0"), true);
});

test("cup inventory tap instantiates at viewport center", () => {
  const inventory = fs.readFileSync("src/controllers/inventory-interaction-controller.js", "utf8");
  const store = fs.readFileSync("src/state/cup-state-store.js", "utf8");
  const worldCoordinates = fs.readFileSync("src/controllers/world-coordinate-controller.js", "utf8");
  assert.equal(inventory.includes("applyInventorySelection(target.dataset.itemType"), true);
  assert.equal(inventory.includes('target.dataset.itemType === "cup-create"'), true);
  assert.equal(inventory.includes("getDefaultFriendDropPoint(target.dataset.value)"), true);
  assert.equal(worldCoordinates.includes("friendType === \"chocolate-milk\" || friendType === \"baby-mr-chocolate-milk\""), true);
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

test("third re-added cup also receives a unique ID", () => {
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

  store.removeCupInstance("cup-olivia-room-1");
  const second = store.addCupToWorld();
  const third = store.addCupToWorld();
  assert.equal(second.id, "cup-olivia-room-3");
  assert.equal(third.id, "cup-olivia-room-4");
  assert.equal(new Set(store.getWorldCupList().map((cup) => cup.id)).size, 3);
});

test("pumpkin woman and shared object hairstyle snapping are configured", () => {
  const config = fs.readFileSync("src/core/game-config.js", "utf8");
  const registry = fs.readFileSync("src/core/object-overlay-registry.js", "utf8");
  const friendController = fs.readFileSync("src/controllers/friend-pointer-controller.js", "utf8");
  const inventoryController = fs.readFileSync("src/controllers/inventory-interaction-controller.js", "utf8");

  assert.equal(config.includes('"pumpkin-woman"'), true);
  assert.equal(config.includes('"pumpkin-woman": "./assets/pumpkin-woman.png"'), true);
  assert.equal(registry.includes("barbie-baby"), true);
  assert.equal(registry.includes("petTypes"), true);
  assert.equal(friendController.includes(".object-hairstyle-overlay"), true);
  assert.equal(friendController.includes("snapDistance"), true);
  assert.equal(inventoryController.includes("onDirectObjectHairstyle"), true);
  const app = fs.readFileSync("src/core/app.js", "utf8");
  assert.equal(app.includes("onDirectObjectHairstyle:"), true);
});

test("Parmesan cheese double-tap rotates and drops a cheese pile", () => {
  const config = fs.readFileSync("src/core/game-config.js", "utf8");
  const inventory = fs.readFileSync("src/ui/inventory.js", "utf8");
  const pointer = fs.readFileSync("src/controllers/friend-pointer-controller.js", "utf8");
  const styles = fs.readFileSync("styles.css", "utf8");

  assert.equal(config.includes('"parmesan-cheese"'), true);
  assert.equal(config.includes('"parmesan-cheese": "./assets/parmesan-cheese.png"'), true);
  assert.equal(inventory.includes('"parmesan-cheese"'), true);
  assert.equal(pointer.includes('friendState.type === "parmesan-cheese"'), true);
  assert.equal(pointer.includes('transform = "rotate(-45deg)"'), true);
  assert.equal(pointer.includes("playParmesanCheeseAnimation"), true);
  assert.equal(pointer.includes('playSfxClip?.("parmesanCheeseActivated")'), true);
  assert.equal(config.includes("parmesanCheeseActivated"), true);
  assert.equal(styles.includes(".parmesan-cheese-particle"), true);
  assert.equal(styles.includes(".parmesan-cheese-pile"), true);
  assert.equal(styles.includes(".parmesan-cheese-pile-speck"), true);
  assert.equal(pointer.includes("art.style.transform = \"rotate(0deg)\""), true);
  assert.equal(styles.includes("@keyframes parmesanCheeseFall"), true);
  assert.equal(styles.includes("@keyframes parmesanCheesePile"), true);
});

test("baby Mr Chocolate Milk shares cup and milk behavior at baby scale", () => {
  const config = fs.readFileSync("src/core/game-config.js", "utf8");
  const inventory = fs.readFileSync("src/ui/inventory.js", "utf8");
  const inventoryController = fs.readFileSync("src/controllers/inventory-interaction-controller.js", "utf8");
  const friendController = fs.readFileSync("src/controllers/friend-pointer-controller.js", "utf8");
  const sequenceController = fs.readFileSync("src/controllers/chocolate-milk-sequence-controller.js", "utf8");
  const styles = fs.readFileSync("styles.css", "utf8");

  assert.equal(config.includes('"baby-mr-chocolate-milk"'), true);
  assert.equal(config.includes('"baby-mr-chocolate-milk": "./assets/chocolate-milk.png"'), true);
  assert.equal(inventory.includes('"baby-mr-chocolate-milk"'), true);
  assert.equal(inventory.includes("Baby Mr Chocolate Milk"), true);
  assert.equal(inventory.includes("inventory-baby-mr-chocolate-milk-thumb"), true);
  assert.equal(inventory.includes("Baby"), true);
  assert.equal(inventoryController.includes('dragState.value === "baby-mr-chocolate-milk"'), true);
  assert.equal(inventoryController.includes("drag-ghost-baby-cup-lid"), true);
  assert.equal(inventoryController.includes("drag-ghost-baby-cup-sleeve"), true);
  assert.equal(inventoryController.includes("drag-ghost-baby-cup-base"), true);
  assert.equal(friendController.includes('friendState?.type !== "baby-mr-chocolate-milk"'), true);
  assert.equal(sequenceController.includes('friendState.type !== "baby-mr-chocolate-milk"'), true);
  assert.equal(styles.includes('.friend-character[data-friend-type="baby-mr-chocolate-milk"]'), true);
  assert.equal(styles.includes(".baby-mr-chocolate-milk-cup-base"), true);
  assert.equal(styles.includes(".baby-mr-chocolate-milk-cup-lid"), true);
  assert.equal(styles.includes(".baby-mr-chocolate-milk-cup-sleeve"), true);
  assert.equal(styles.includes(".baby-mr-chocolate-milk-hairstyle"), true);
});

test("water bottle is in accessories and remains a snap source", () => {
  const ui = fs.readFileSync("src/ui/inventory.js", "utf8");
  assert.equal(ui.includes('"lavalamp", "chocolate-milk", "baby-mr-chocolate-milk", "parmesan-cheese", "uke"'), true);
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
