const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { loadBrowserScript } = require("./test-helpers");

test("snap SFX registry covers all configured snap objects", () => {
  const context = { window: {} };
  loadBrowserScript("src/core/world-anchor-registry.js", context);
  loadBrowserScript("src/core/game-config.js", context);
  loadBrowserScript("src/core/object-sfx-trigger-registry.js", context);
  const registry = context.window.CuppyLandObjectSfxTriggerRegistry;
  const sfxMap = context.window.CuppyLandGame?.audioConfig?.sfxClips || {};

  assert.equal(registry.getSnapSfx("rocketman-craft"), "rocketship");
  assert.equal(registry.getSnapSfx("spongebob-stuffy"), "spongebob");
  assert.equal(registry.getSnapSfx("hairy-guy"), "hairyGuy");
  assert.equal(registry.getSnapSfx("furball-guy"), "furballGuy");
  assert.equal(registry.getSnapSfx("golden-puppy"), "goldenPuppyActivated");
  assert.equal(registry.getSnapSfx("rocketman-craft"), "rocketship");
  assert.equal(registry.getSnapSfx("barbie-blonde"), "barbieBlondeSnap");
  assert.equal(registry.getSnapSfx("barbie-blonde-baby"), "barbieBlondeBabySnap");
  assert.equal(registry.validate(sfxMap).valid, true);
});

test("double-tap SFX registry covers every object with a registered activation clip", () => {
  const context = { window: {} };
  loadBrowserScript("src/core/object-sfx-trigger-registry.js", context);
  const registry = context.window.CuppyLandObjectSfxTriggerRegistry;

  assert.equal(registry.getDoubleTapSfx("golden-puppy"), "puppyBarking");
  assert.equal(registry.getDoubleTapSfx("barbie-blonde"), "blondeBarbieActivated");
  assert.equal(registry.getDoubleTapSfx("barbie-blonde-baby"), "blondeBarbieBabyActivated");
  assert.equal(registry.getDoubleTapSfx("punpkin-man"), "pumpkinManActivated");
  assert.equal(registry.getDoubleTapSfx("pumpkin-woman"), null);
  assert.equal(registry.getDoubleTapSfx("rocketman-craft"), "rocketmanActivated");
  assert.equal(registry.getDoubleTapSfx("water-bowl"), "drinkingFountainActivated");
  assert.equal(registry.getDoubleTapSfx("turkey"), "turkeyGobble");
  assert.equal(registry.getDoubleTapSfx("fishbowl"), "fishbowlActivated");
  assert.equal(registry.getDoubleTapSfx("parmesan-cheese"), "parmesanCheeseActivated");
  assert.equal(registry.getDoubleTapSfx("uke"), "ukuleleActivated");
});

test("trampoline and bed entry share configured activation SFX", () => {
  const context = { window: {} };
  loadBrowserScript("src/core/object-sfx-trigger-registry.js", context);
  const registry = context.window.CuppyLandObjectSfxTriggerRegistry;

  assert.equal(registry.getBounceActivationSfx("barbie-blonde"), "blondeBarbieActivated");
  assert.equal(registry.bounceActivationSfxByType["golden-puppy"], "goldenPuppyActivated");
  assert.equal(registry.bounceActivationSfxByType["barbie-blonde"], "blondeBarbieActivated");
  assert.equal(registry.bounceActivationSfxByType["barbie-blonde-baby"], "blondeBarbieBabyActivated");
  assert.equal(registry.bounceActivationSfxByType["punpkin-man"], "pumpkinManActivated");
  assert.equal(registry.bounceActivationSfxByType["turkey"], "turkeyGobble");
  assert.equal(registry.bounceActivationSfxByType["fishbowl"], "fishbowlActivated");
  assert.equal(registry.bounceActivationSfxByType["parmesan-cheese"], "parmesanCheeseActivated");
  assert.equal(registry.bounceActivationSfxByType["rocketman-craft"], "rocketmanActivated");
  assert.equal(registry.bounceActivationSfxByType["uke"], "ukuleleActivated");
});

test("snap and double-tap dispatch is wired to gameplay controllers", () => {
  const gameRules = fs.readFileSync("src/controllers/game-rules-controller.js", "utf8");
  const friendPointer = fs.readFileSync("src/controllers/friend-pointer-controller.js", "utf8");
  const worldFriend = fs.readFileSync("src/controllers/world-friend-controller.js", "utf8");
  const index = fs.readFileSync("index.html", "utf8");

  assert.equal(gameRules.includes("CuppyLandObjectSfxTriggerRegistry?.playSnapSfx"), true);
  assert.equal(friendPointer.includes('friendState.type === "golden-puppy"'), true);
  assert.equal(friendPointer.includes("CuppyLandObjectSfxTriggerRegistry?.playDoubleTapSfx"), true);
  assert.equal(friendPointer.includes('friendState.type === "barbie-blonde"'), true);
  assert.equal(friendPointer.includes('friendState.type === "fishbowl"'), true);
  assert.equal(friendPointer.includes('toggleFishbowlSequence(friendState.id)'), true);
  assert.equal(friendPointer.includes('friendState.pointerActivatedSfxPlayed'), true);
  assert.equal(worldFriend.includes("CuppyLandObjectSfxTriggerRegistry?.playSnapSfx"), true);
  assert.equal(index.includes("object-sfx-trigger-registry.js"), true);
});

test("world intro explicitly unlocks and plays without focus gating", () => {
  const app = fs.readFileSync("src/core/app.js", "utf8");
  const audio = fs.readFileSync("src/audio/audio.js", "utf8");
  assert.equal(app.includes("CuppyLandAudio?.unlockAudio?.()"), true);
  assert.equal(app.includes('playSfxClip?.("playgroundIntroFx")'), true);
  assert.equal(app.includes("}, 80);"), true);
  assert.equal(audio.includes("document.hidden || !document.hasFocus()"), false);
  assert.equal(audio.includes("if (document.hidden)"), true);
  assert.equal(audio.includes("sfxClipSources[clipName]"), true);
  assert.equal(audio.includes("clip.load()"), true);
});

test("all object SFX registry clip files exist", () => {
  const context = { window: {} };
  loadBrowserScript("src/core/world-anchor-registry.js", context);
  loadBrowserScript("src/core/game-config.js", context);
  loadBrowserScript("src/core/object-sfx-trigger-registry.js", context);
  const registry = context.window.CuppyLandObjectSfxTriggerRegistry;
  const sfxMap = context.window.CuppyLandGame.audioConfig.sfxClips;

  assert.equal(registry.validate(sfxMap).valid, true);
  [...Object.values(registry.snapSfxByType), ...Object.values(registry.doubleTapSfxByType).filter(Boolean)]
    .forEach((clipName) => {
      const sfxPath = sfxMap[clipName];
      assert.equal(Boolean(sfxPath), true, `missing clip key ${clipName}`);
      assert.equal(fs.existsSync(sfxPath.replace("./", "")), true, `missing file ${sfxPath}`);
    });
});
