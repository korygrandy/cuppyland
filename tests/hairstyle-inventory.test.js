const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { loadBrowserScript } = require("./test-helpers");

test("all added hairstyle and hat assets are configured for inventory use", () => {
  const context = { window: { CuppyLandWorldAnchors: { barbieActivationAnchors: {}, backgroundObjectAnchors: {} } } };
  loadBrowserScript("src/core/game-config.js", context);

  const gameConfig = context.window.CuppyLandGame;
  const expectedTypes = [
    "festive",
    "hair-bow",
    "hair-bow-festive",
    "hat-ball-cap",
    "hat-elf",
    "hat-santa",
    "hat-santa-crotchet",
  ];

  assert.ok(Array.isArray(gameConfig.hairstyleTypes));
  expectedTypes.forEach((type) => {
    assert.equal(gameConfig.hairstyleTypes.includes(type), true);
    const assetPath = gameConfig.hairstyleAssetMap?.[type];
    assert.equal(typeof assetPath, "string");
    assert.equal(fs.existsSync(assetPath.replace("./", "")), true);
  });
});

test("hairstyle overlay always resolves from hairstyle asset map", () => {
  const renderSource = fs.readFileSync("src/controllers/render-controller.js", "utf8");
  assert.equal(renderSource.includes("gameConfig.hairstyleAssetMap?.[cupState.hairstyle || \"child\"]"), true);
});

test("pumpkin man is configured as a friend inventory asset", () => {
  const context = { window: { CuppyLandWorldAnchors: { barbieActivationAnchors: {}, backgroundObjectAnchors: {} } } };
  loadBrowserScript("src/core/game-config.js", context);

  const gameConfig = context.window.CuppyLandGame;
  assert.equal(gameConfig.friendTypes.includes("punpkin-man"), true);
  assert.equal(gameConfig.hairstyleTypes.includes("punpkin-man"), false);
  assert.equal(gameConfig.friendAssetMap?.["punpkin-man"], "./assets/punpkin-man.png");
  assert.equal(fs.existsSync("assets/punpkin-man.png"), true);
});
