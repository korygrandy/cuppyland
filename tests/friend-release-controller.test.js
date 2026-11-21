const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./test-helpers");

test("toy is not consumed when puppy sequence cannot start", () => {
  const puppyElement = { dataset: { friendId: "puppy-1" } };
  const context = {
    window: {
      CuppyLandFriendOverlap: {
        findOverlappingElement: () => puppyElement,
      },
      CuppyLandInteractionRules: {
        getToySequenceType: () => "ball",
      },
    },
  };
  loadBrowserScript("src/controllers/friend-release-controller.js", context);

  const toyState = { id: "ball-1", type: "dogtoy-ball" };
  const puppyState = { id: "puppy-1", type: "golden-puppy" };
  let removedCount = 0;

  const controller = context.window.CuppyLandFriendReleaseController.createController({
    worldCanvas: {},
    resolveFriendStateForElement: (element) => (element === puppyElement ? puppyState : null),
    removeFriendInstance: () => {
      removedCount += 1;
      return true;
    },
    playGoldenPuppyWithBall: () => false,
  });

  assert.equal(controller.handleToyRelease({}, toyState), false);
  assert.equal(removedCount, 0);
});

test("ball already claimed by another puppy cannot be consumed", () => {
  const puppyElement = { dataset: { friendId: "puppy-2" } };
  const context = {
    window: {
      CuppyLandFriendOverlap: {
        findOverlappingElement: () => puppyElement,
      },
      CuppyLandInteractionRules: {
        getToySequenceType: () => "ball",
      },
    },
  };
  loadBrowserScript("src/controllers/puppy-ball-claim-helper.js", context);
  loadBrowserScript("src/controllers/friend-release-controller.js", context);

  const toyState = { id: "ball-1", type: "dogtoy-ball", claimedByPuppyId: "puppy-1" };
  const puppyState = { id: "puppy-2", type: "golden-puppy" };
  let removedCount = 0;
  let startedCount = 0;

  const controller = context.window.CuppyLandFriendReleaseController.createController({
    worldCanvas: {},
    resolveFriendStateForElement: (element) => (element === puppyElement ? puppyState : null),
    removeFriendInstance: () => {
      removedCount += 1;
      return true;
    },
    playGoldenPuppyWithBall: () => {
      startedCount += 1;
      return true;
    },
  });

  assert.equal(controller.handleToyRelease({}, toyState), false);
  assert.equal(startedCount, 0);
  assert.equal(removedCount, 0);
});
