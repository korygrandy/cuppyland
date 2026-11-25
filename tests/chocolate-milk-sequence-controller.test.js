const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./test-helpers");

function createSequenceController(cupStates) {
  const friends = [{
    id: "milk-1",
    type: "chocolate-milk",
    attachedCupId: "cup-1",
    sequenceCompleted: false,
  }];
  const context = {
    window: {},
    setInterval: () => 1,
    clearInterval: () => {},
  };
  loadBrowserScript("src/controllers/chocolate-milk-sequence-controller.js", context);
  const controller = context.window.CuppyLandChocolateMilkSequenceController.createController({
    getWorldFriendList: () => friends,
    findFriendById: (id) => friends.find((friend) => friend.id === id) || null,
    isCupOpen: (cupId) => {
      const cupState = cupStates[cupId];
      return Boolean(cupState && (cupState.lidVisible === false || cupState.lidDetached === true));
    },
    getSequenceConfig: () => ({ durationMs: 5000, frameIntervalMs: 320 }),
    syncAttachedFriendPosition: () => {},
    updateFriendElementAsset: () => {},
  });
  return { controller, friends };
}

test("chocolate milk spill CSS is positioned 35px lower", () => {
  const fs = require("node:fs");
  const styles = fs.readFileSync("styles.css", "utf8");
  assert.equal(styles.includes("inset: 35px 0 0;"), true);
  assert.equal(styles.includes("top: 68px;"), true);
  assert.equal(styles.includes("top: 252px;"), true);
});

test("chocolate milk spill swaps sequence 2 and 3 above the cup", () => {
  const fs = require("node:fs");
  const controller = fs.readFileSync("src/controllers/chocolate-milk-sequence-controller.js", "utf8");
  const friendController = fs.readFileSync("src/controllers/world-friend-controller.js", "utf8");
  const config = fs.readFileSync("src/core/game-config.js", "utf8");
  const styles = fs.readFileSync("styles.css", "utf8");
  assert.equal(controller.includes("friendState.sequenceFrame = 2"), true);
  assert.equal(controller.includes("activeFriend.sequenceFrame !== nextFrame"), true);
  assert.equal(friendController.includes('"chocolate-milk-sequence-2"'), true);
  assert.equal(friendController.includes('"chocolate-milk-sequence-3"'), true);
  assert.equal(friendController.includes("is-chocolate-milk-spilling"), true);
  assert.equal(config.includes("chocolate-milk-sequence-2"), true);
  assert.equal(config.includes("chocolate-milk-sequence-3"), true);
  assert.equal(styles.includes("z-index: 1402 !important"), true);
});

test("CSS spill effect replaces frame asset swapping", () => {
  let spillElement = null;
  const cupClasses = new Set();
  const cupElement = {
    querySelector: (selector) => selector === ".chocolate-milk-spill" ? spillElement : null,
    appendChild: (element) => {
      spillElement = element;
      spillElement.added = true;
    },
    classList: {
      add: (name) => cupClasses.add(name),
      remove: (name) => cupClasses.delete(name),
    },
  };
  const friends = [{
    id: "milk-1",
    type: "chocolate-milk",
    attachedCupId: "cup-1",
    sequenceCompleted: false,
  }];
  let updates = 0;
  const context = {
    window: {},
    document: {
      createElement: () => ({
        className: "",
        classList: {
          remove: () => {},
          add: () => {},
          toggle: () => {},
        },
        setAttribute: () => {},
        innerHTML: "",
        offsetWidth: 260,
        remove: () => {},
      }),
    },
    setInterval: () => 1,
    clearInterval: () => {},
  };
  loadBrowserScript("src/controllers/chocolate-milk-sequence-controller.js", context);
  const controller = context.window.CuppyLandChocolateMilkSequenceController.createController({
    getWorldFriendList: () => friends,
    findFriendById: (id) => friends.find((friend) => friend.id === id) || null,
    isCupOpen: () => true,
    getSequenceConfig: () => ({ durationMs: 5000, frameIntervalMs: 320 }),
    syncAttachedFriendPosition: () => {},
    updateFriendElementAsset: () => { updates += 1; },
    getCupElementById: () => cupElement,
  });

  assert.equal(controller.startForCup("milk-1", "cup-1"), true);
  assert.equal(friends[0].sequenceFrame, 2);
  assert.equal(Boolean(spillElement), true);
  assert.equal(spillElement.className, "chocolate-milk-spill");
  assert.equal(spillElement.innerHTML.includes("milk-flow"), true);
  assert.equal(spillElement.innerHTML.includes("milk-splash"), true);
  assert.equal(cupClasses.has("is-spilling"), true);
  assert.equal(updates, 1);
});

test("chocolate milk spill starts only for an open cup", () => {
  const open = createSequenceController({
    "cup-1": { lidVisible: false, lidDetached: true },
  });
  assert.equal(open.controller.startForCup("milk-1", "cup-1"), true);

  const closed = createSequenceController({
    "cup-1": { lidVisible: true, lidDetached: false },
  });
  assert.equal(closed.controller.startForCup("milk-1", "cup-1"), false);
});

test("filled cup can start and restart spill after the lid is removed", () => {
  const { controller, friends } = createSequenceController({
    "cup-1": { lidVisible: false, lidDetached: true, filled: true },
  });
  assert.equal(controller.startForCup("milk-1", "cup-1"), true);
  friends[0].sequenceCompleted = true;
  friends[0].attachedCupId = "cup-1";
  assert.equal(controller.startForCup("milk-1", "cup-1"), true);
});

test("spill stop clears frames and open-cup refresh stops sealed-cup spills", () => {
  const friends = [{
    id: "milk-1",
    type: "chocolate-milk",
    attachedCupId: "cup-1",
    sequenceCompleted: false,
    sequenceFrame: 2,
  }];
  let cupOpen = true;
  const context = {
    window: {},
    setInterval: () => 1,
    clearInterval: () => {},
  };
  loadBrowserScript("src/controllers/chocolate-milk-sequence-controller.js", context);
  const controller = context.window.CuppyLandChocolateMilkSequenceController.createController({
    getWorldFriendList: () => friends,
    findFriendById: (id) => friends.find((friend) => friend.id === id) || null,
    isCupOpen: () => cupOpen,
    getSequenceConfig: () => ({ durationMs: 5000, frameIntervalMs: 320 }),
    syncAttachedFriendPosition: () => {},
    updateFriendElementAsset: () => {},
  });

  assert.equal(controller.startForCup("milk-1", "cup-1"), true);
  cupOpen = false;
  controller.refresh();
  assert.equal(friends[0].sequenceFrame, null);
});

test("spill completion removes Mr Chocolate Milk and fires completion once", () => {
  const friends = [{
    id: "milk-1",
    type: "chocolate-milk",
    attachedCupId: "cup-1",
    sequenceCompleted: false,
  }];
  let intervalCallback = null;
  let nowMs = 1000;
  let removedCount = 0;
  let completedCount = 0;
  const context = {
    window: {},
    Date: { now: () => nowMs },
    setInterval: (callback) => {
      intervalCallback = callback;
      return 1;
    },
    clearInterval: () => {},
  };
  loadBrowserScript("src/controllers/chocolate-milk-sequence-controller.js", context);
  const controller = context.window.CuppyLandChocolateMilkSequenceController.createController({
    getWorldFriendList: () => friends,
    findFriendById: (id) => friends.find((friend) => friend.id === id) || null,
    isCupOpen: () => true,
    getSequenceConfig: () => ({ durationMs: 5000, frameIntervalMs: 320 }),
    syncAttachedFriendPosition: () => {},
    updateFriendElementAsset: () => {},
    getCupElementById: () => null,
    removeFriendInstance: (friendId) => {
      removedCount += 1;
      return friendId === "milk-1";
    },
    onCompleted: (cupId) => {
      completedCount += 1;
      assert.equal(cupId, "cup-1");
    },
  });

  assert.equal(controller.startForCup("milk-1", "cup-1"), true);
  nowMs = 6100;
  intervalCallback();
  assert.equal(friends[0].sequenceCompleted, true);
  assert.equal(removedCount, 1);
  assert.equal(completedCount, 1);
});
