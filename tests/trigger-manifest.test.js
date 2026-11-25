const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { loadBrowserScript } = require("./test-helpers");

test("trigger manifest guards required hitboxes and activations", () => {
  const context = { window: {} };
  loadBrowserScript("src/core/world-anchor-registry.js", context);
  loadBrowserScript("src/core/game-config.js", context);
  loadBrowserScript("src/core/trigger-manifest.js", context);

  const result = context.window.CuppyLandTriggerManifest.validate({
    worldAnchors: context.window.CuppyLandGame.backgroundObjectAnchors,
    friendTypes: context.window.CuppyLandGame.friendTypes,
    assetMap: context.window.CuppyLandGame.friendAssetMap,
    sfxMap: context.window.CuppyLandGame.audioConfig.sfxClips,
    frameAssets: context.window.CuppyLandGame.chocolateMilkSequence?.frameAssets,
  });

  assert.equal(result.valid, true, result.errors.join("\n"));
  const ids = new Set(result.triggers.map((trigger) => trigger.id));
  [
    "bed-bounce",
    "trampoline-bounce",
    "tube-slide",
    "drinking-fountain",
    "merry-go-round",
    "puppy-dogbed",
    "fishbowl-water-bowl",
    "pumpkin-man-double-tap",
    "pumpkin-woman-double-tap",
  ].forEach((requiredId) => assert.equal(ids.has(requiredId), true, `missing ${requiredId}`));
});

test("all trigger assets and SFX paths exist", () => {
  const context = { window: {} };
  loadBrowserScript("src/core/trigger-manifest.js", context);
  const manifest = context.window.CuppyLandTriggerManifest.triggers;

  manifest.forEach((trigger) => {
    (trigger.assets || []).forEach((assetPath) => {
      const filePath = assetPath.replace("./", "");
      assert.equal(fs.existsSync(filePath), true, `${trigger.id} missing ${assetPath}`);
    });
  });

  const gameContext = { window: {} };
  loadBrowserScript("src/core/world-anchor-registry.js", gameContext);
  loadBrowserScript("src/core/game-config.js", gameContext);
  const sfxMap = gameContext.window.CuppyLandGame.audioConfig.sfxClips;
  manifest.forEach((trigger) => {
    if (trigger.sfx) {
      const sfxPath = sfxMap[trigger.sfx];
      assert.equal(Boolean(sfxPath), true, `${trigger.id} missing SFX key ${trigger.sfx}`);
      assert.equal(fs.existsSync(sfxPath.replace("./", "")), true, `${trigger.id} missing ${sfxPath}`);
    }
  });
});
