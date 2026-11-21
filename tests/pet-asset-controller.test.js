const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./test-helpers");

test("doghouse resolves ball and collar variants from attached puppy state", () => {
  const context = { window: {} };
  loadBrowserScript("src/controllers/pet-asset-controller.js", context);

  const state = { activeWorld: "playground" };
  const worldFriends = [
    { id: "doghouse-1", type: "doghouse", activated: true },
    { id: "puppy-1", type: "golden-puppy", doghouseId: "doghouse-1", hasBall: true, hasCollar: false },
  ];
  const assetMap = {
    doghouse: "doghouse",
    "doghouse-with-dog": "doghouse-with-dog",
    "doghouse-with-ball": "doghouse-with-ball",
    "doghouse-with-collar": "doghouse-with-collar",
  };

  const controller = context.window.CuppyLandPetAssetController.createController({
    state,
    getWorldFriendList: () => worldFriends,
    getFriendAssetMap: () => assetMap,
  });

  assert.equal(controller.resolveDoghouse(worldFriends[0]), "doghouse-with-ball");

  worldFriends[1].hasBall = false;
  worldFriends[1].hasCollar = true;
  assert.equal(controller.resolveDoghouse(worldFriends[0]), "doghouse-with-collar");
});

test("golden puppy resolves squirrel sitting variant", () => {
  const context = { window: {} };
  loadBrowserScript("src/controllers/pet-asset-controller.js", context);

  const controller = context.window.CuppyLandPetAssetController.createController({
    state: { activeWorld: "playground" },
    getWorldFriendList: () => [],
    getFriendAssetMap: () => ({
      "golden-puppy-sitting": "puppy-sit",
      "golden-puppy-sitting-with-squirrel": "puppy-sit-squirrel",
    }),
  });

  const asset = controller.resolveGoldenPuppy({
    type: "golden-puppy",
    hasSquirrel: true,
  });

  assert.equal(asset, "puppy-sit-squirrel");
});
