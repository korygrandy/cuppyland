const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./test-helpers");

test("friend asset resolver preserves Baby Mr Chocolate Milk sequence assets", () => {
  const context = { window: {} };
  loadBrowserScript("src/controllers/friend-asset-resolver.js", context);
  const resolver = context.window.CuppyLandFriendAssetResolver;
  const assetMap = {
    "baby-mr-chocolate-milk": "./assets/chocolate-milk.png",
    "chocolate-milk-sequence-2": "./assets/chocolate-milk-sequence2.png",
    "chocolate-milk-sequence-3": "./assets/chocolate-milk-sequence3.png",
  };

  assert.equal(resolver.resolveFriendAsset(
    { type: "baby-mr-chocolate-milk", sequenceFrame: 2 },
    { getFriendAssetMap: () => assetMap }
  ), "./assets/chocolate-milk-sequence2.png");
  assert.equal(resolver.resolveFriendAsset(
    { type: "baby-mr-chocolate-milk", sequenceFrame: 3 },
    { getFriendAssetMap: () => assetMap }
  ), "./assets/chocolate-milk-sequence3.png");
  assert.equal(resolver.resolveFriendAsset(
    { type: "baby-mr-chocolate-milk" },
    { getFriendAssetMap: () => assetMap }
  ), "./assets/chocolate-milk.png");
});

test("friend asset resolver keeps Barbie and pet resolution", () => {
  const context = { window: {} };
  loadBrowserScript("src/controllers/friend-asset-resolver.js", context);
  const resolver = context.window.CuppyLandFriendAssetResolver;
  const assetMap = {
    "barbie-blonde": "./assets/barbie-blonde.png",
    "barbie-blonde-activated": "./assets/barbie-blonde-activated.png",
  };

  assert.equal(resolver.resolveFriendAsset(
    { type: "barbie-blonde", activated: true },
    { getFriendAssetMap: () => assetMap }
  ), "./assets/barbie-blonde-activated.png");
  assert.equal(resolver.isBarbieActivated({ sequenceFrame: 2 }), true);
});
