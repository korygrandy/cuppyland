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

test("ball release starts one ball sequence once and consumes the ball", () => {
  const puppyElement = { dataset: { friendId: "puppy-1" } };
  const context = {
    window: {
      CuppyLandFriendOverlap: {
        findOverlappingElement: () => puppyElement,
      },
      CuppyLandInteractionRules: {
        getToySequenceType: () => "ball",
      },
      CuppyLandPuppyBallClaimHelper: {
        tryClaim: () => true,
        release: () => {},
      },
    },
  };
  loadBrowserScript("src/controllers/friend-release-controller.js", context);

  const toyState = { id: "ball-1", type: "dogtoy-ball" };
  const puppyState = { id: "puppy-1", type: "golden-puppy", sequenceActive: false, hasBall: false };
  let removedCount = 0;
  let startedCount = 0;

  const controller = context.window.CuppyLandFriendReleaseController.createController({
    worldCanvas: {},
    resolveFriendStateForElement: () => puppyState,
    removeFriendInstance: () => {
      removedCount += 1;
      return true;
    },
    playGoldenPuppyWithBall: () => {
      startedCount += 1;
      return true;
    },
  });

  assert.equal(controller.handleToyRelease({}, toyState), true);
  assert.equal(startedCount, 1);
  assert.equal(removedCount, 1);
});

test("ball release rejects puppy when ball sequence or final ball state is active", () => {
  const puppyElement = { dataset: { friendId: "puppy-1" } };
  const context = {
    window: {
      CuppyLandFriendOverlap: {
        findOverlappingElement: () => puppyElement,
      },
      CuppyLandInteractionRules: {
        getToySequenceType: () => "ball",
      },
      CuppyLandPuppyBallClaimHelper: {
        tryClaim: () => true,
        release: () => {},
      },
    },
  };
  loadBrowserScript("src/controllers/friend-release-controller.js", context);

  const toyState = { id: "ball-1", type: "dogtoy-ball" };
  const puppyState = { id: "puppy-1", type: "golden-puppy", sequenceActive: true, hasBall: false };
  let startedCount = 0;

  const controller = context.window.CuppyLandFriendReleaseController.createController({
    worldCanvas: {},
    resolveFriendStateForElement: () => puppyState,
    removeFriendInstance: () => false,
    playGoldenPuppyWithBall: () => {
      startedCount += 1;
      return true;
    },
  });

  assert.equal(controller.handleToyRelease({}, toyState), false);
  assert.equal(startedCount, 0);
});

test("every dogtoy starts once on every sitting puppy combination", () => {
  const puppyElement = { dataset: { friendId: "puppy-1" } };
  const context = {
    window: {
      CuppyLandFriendOverlap: {
        findOverlappingElement: () => puppyElement,
      },
      CuppyLandPuppyBallClaimHelper: {
        tryClaim: () => true,
        release: () => {},
      },
    },
  };
  loadBrowserScript("src/core/interaction-rule-registry.js", context);
  loadBrowserScript("src/controllers/friend-release-controller.js", context);

  const variants = [
    { name: "plain", state: {} },
    { name: "rope", state: { hasRope: true } },
    { name: "bone", state: { hasBone: true } },
    { name: "ball", state: { hasBall: true } },
    { name: "squirrel", state: { hasSquirrel: true } },
  ];
  const toys = [
    { type: "dogbone", duplicateKey: null, callback: "playGoldenPuppyWithBone" },
    { type: "rope-dogtoy", duplicateKey: null, callback: "playGoldenPuppyWithRope" },
    { type: "dogtoy-ball", duplicateKey: "hasBall", callback: "playGoldenPuppyWithBall" },
    { type: "squirrel", duplicateKey: "hasSquirrel", callback: "playGoldenPuppyWithSquirrel" },
  ];

  variants.forEach((variant) => {
    toys.forEach((toy) => {
      const puppyState = {
        id: "puppy-1",
        type: "golden-puppy",
        sequenceActive: false,
        ...variant.state,
      };
      let startedCount = 0;
      let removedCount = 0;
      const callbacks = {
        worldCanvas: {},
        resolveFriendStateForElement: () => puppyState,
        removeFriendInstance: () => {
          removedCount += 1;
          return true;
        },
      };
      callbacks.playGoldenPuppyWithBone = () => {
        if (toy.callback === "playGoldenPuppyWithBone") {
          startedCount += 1;
        }
        return true;
      };
      callbacks.playGoldenPuppyWithRope = () => {
        if (toy.callback === "playGoldenPuppyWithRope") {
          startedCount += 1;
        }
        return true;
      };
      callbacks.playGoldenPuppyWithBall = () => {
        if (toy.callback === "playGoldenPuppyWithBall") {
          startedCount += 1;
        }
        return true;
      };
      callbacks.playGoldenPuppyWithSquirrel = () => {
        if (toy.callback === "playGoldenPuppyWithSquirrel") {
          startedCount += 1;
        }
        return true;
      };

      const controller = context.window.CuppyLandFriendReleaseController.createController(callbacks);
      const toyState = { id: `${toy.type}-1`, type: toy.type };
      const duplicate = toy.duplicateKey ? Boolean(puppyState[toy.duplicateKey]) : false;

      assert.equal(
        controller.handleToyRelease({}, toyState),
        !duplicate,
        `${toy.type} onto ${variant.name}`
      );
      assert.equal(startedCount, duplicate ? 0 : 1, `${toy.type} starts on ${variant.name}`);
      assert.equal(removedCount, duplicate ? 0 : 1, `${toy.type} consumes on ${variant.name}`);
    });
  });
});
