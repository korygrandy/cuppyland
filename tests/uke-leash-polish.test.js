const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("uke shake is slowed and music notes use an S-curve", () => {
  const styles = fs.readFileSync("styles.css", "utf8");

  assert.equal(styles.includes("uke-dance-shake 1165ms"), true);
  assert.equal(styles.includes("is-dancing-fast"), true);
  assert.equal(styles.includes("uke-snap-dance 500ms ease-in-out 6"), true);
  assert.equal(styles.includes("uke-snap-shake 750ms ease-in-out 4"), true);
  assert.equal(styles.includes(".uke-music-notes"), true);
  assert.equal(styles.includes(".uke-music-note"), true);
  assert.equal(styles.includes("@keyframes uke-note-s-curve"), true);
  assert.equal(styles.includes("--note-direction"), true);
});

test("leash overlay uses fine-tuned sitting pose offsets", () => {
  const styles = fs.readFileSync("styles.css", "utf8");

  assert.equal(styles.includes(".dog-leash-overlay"), true);
  assert.equal(styles.includes("left: 44px"), true);
  assert.equal(styles.includes("top: -47px"), true);
  assert.equal(styles.includes("width: 100%"), true);
});

test("uke animation is controlled by SFX completion rather than fixed timers", () => {
  const pointerSource = fs.readFileSync("src/controllers/friend-pointer-controller.js", "utf8");
  const worldSource = fs.readFileSync("src/controllers/world-friend-controller.js", "utf8");

  assert.equal(pointerSource.includes('playSfxClip?.("ukuleleActivated"'), true);
  assert.equal(pointerSource.includes("ukuleleDanceMs"), false);
  assert.equal(worldSource.includes('playSfxClip("ukuleleActivated", finishUkeDance)'), true);
  assert.equal(worldSource.includes("ukuleleDanceMs"), false);
});

test("uke inventory snap queues a one-shot fast dance after render", () => {
  const gameRulesSource = fs.readFileSync("src/controllers/game-rules-controller.js", "utf8");
  const worldSource = fs.readFileSync("src/controllers/world-friend-controller.js", "utf8");
  const releaseSource = fs.readFileSync("src/controllers/friend-release-controller.js", "utf8");

  assert.equal(gameRulesSource.includes("ukeDancePending"), true);
  assert.equal(worldSource.includes("ukeDancePending"), true);
  assert.equal(worldSource.includes("startUkeDance(friendState.id, { fast: true })"), true);
  assert.equal(releaseSource.includes("friendState?.type === \"uke\""), false);
  assert.equal(worldSource.includes('playSfxClip("uke", finishUkeDance)'), true);
  assert.equal(worldSource.includes('playSfxClip("ukuleleActivated", finishUkeDance)'), true);
});

test("uke removal stops the active ukulele SFX", () => {
  const removalSource = fs.readFileSync("src/controllers/friend-removal-controller.js", "utf8");
  const worldSource = fs.readFileSync("src/controllers/world-friend-controller.js", "utf8");

  assert.equal(removalSource.includes('stopSfxClip("ukuleleActivated")'), true);
  assert.equal(worldSource.includes("stopSfxClip"), true);
});

test("leash attachment requires the puppy collar", () => {
  const vm = require("node:vm");
  const source = fs.readFileSync("src/controllers/puppy-sequence-guard-helper.js", "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: "puppy-sequence-guard-helper.js" });
  const guard = context.window.CuppyLandPuppySequenceGuardHelper;

  assert.equal(guard.canAttachLeash({ hasCollar: false, sequenceActive: false }), false);
  assert.equal(guard.canAttachLeash({ hasCollar: true, sequenceActive: false }), true);
  assert.equal(guard.canAttachLeash({ hasCollar: true, sequenceActive: true }), false);
});

test("puppy leash starts walking on drag and returns to sitting on release", () => {
  const pointerSource = fs.readFileSync("src/controllers/friend-pointer-controller.js", "utf8");
  const petSource = fs.readFileSync("src/controllers/pet-asset-controller.js", "utf8");

  assert.equal(pointerSource.includes("friendState.walkingActive = true"), true);
  assert.equal(pointerSource.includes("friendState.walkingActive = false"), true);
  assert.equal(pointerSource.includes("friendState.sequencePlayingAsset = null"), true);
  assert.equal(petSource.includes("walkingActive && friendState?.hasLeash"), true);
});

test("sitting collar and leash anchors use fine-tuned offsets", () => {
  const styles = fs.readFileSync("styles.css", "utf8");

  assert.equal(styles.includes("left: -10px"), true);
  assert.equal(styles.includes("top: 7px"), true);
  assert.equal(styles.includes("left: 44px"), true);
  assert.equal(styles.includes("top: -47px"), true);
  assert.equal(styles.includes("left: -20px"), true);
  assert.equal(styles.includes("top: 44px"), true);
  assert.equal(styles.includes("left: 30px"), true);
  assert.equal(styles.includes("top: 14px"), true);
});

test("right-facing sitting and playing puppy overlays use separate offsets", () => {
  const styles = fs.readFileSync("styles.css", "utf8");
  const pointerSource = fs.readFileSync("src/controllers/friend-pointer-controller.js", "utf8");

  assert.equal(styles.includes(".friend-character.is-facing-right .dog-collar-overlay"), true);
  assert.equal(styles.includes("left: 0"), true);
  assert.equal(styles.includes(".friend-character.is-facing-right .dog-leash-overlay"), true);
  assert.equal(styles.includes("left: 54px"), true);
  assert.equal(styles.includes(".friend-character.is-facing-left .dog-collar-overlay"), true);
  assert.equal(styles.includes("left: -4px"), true);
  assert.equal(styles.includes(".friend-character.is-facing-left .dog-leash-overlay"), true);
  assert.equal(styles.includes("left: 50px"), true);
  assert.equal(styles.includes(".friend-character.is-facing-right.is-puppy-playing .dog-collar-overlay"), true);
  assert.equal(styles.includes("left: 0"), true);
  assert.equal(styles.includes(".friend-character.is-facing-right.is-puppy-playing .dog-leash-overlay"), true);
  assert.equal(styles.includes("left: 5px"), true);
  assert.equal(pointerSource.includes('friendElement.classList.toggle("is-facing-right"'), true);
});

test("walking puppy loops panting and randomized barking until release", () => {
  const pointerSource = fs.readFileSync("src/controllers/friend-pointer-controller.js", "utf8");
  const worldSource = fs.readFileSync("src/controllers/world-friend-controller.js", "utf8");

  assert.equal(pointerSource.includes('playLoopingSfxClip?.("goldenPuppyActivated")'), true);
  assert.equal(pointerSource.includes('playSfxClip?.("puppyBarking")'), true);
  assert.equal(pointerSource.includes("900 + Math.floor(Math.random() * 1100)"), true);
  assert.equal(pointerSource.includes("stopWalkingPuppyAudio(friendState)"), true);
  assert.equal(worldSource.includes("leashOverlay.addEventListener(\"pointerdown\""), true);
});

test("trampoline debug line is removed and puppy overlay poses are separated", () => {
  const styles = fs.readFileSync("styles.css", "utf8");
  const pointerSource = fs.readFileSync("src/controllers/friend-pointer-controller.js", "utf8");
  const sequenceSource = fs.readFileSync("src/controllers/puppy-sequence-controller.js", "utf8");

  assert.equal(styles.includes('[data-object-id="trampoline"]::after'), false);
  assert.equal(styles.includes(".friend-character.is-puppy-playing"), true);
  assert.equal(styles.includes(".friend-character.is-walking-puppy"), true);
  assert.equal(styles.includes("transform: scale(0.5)"), true);
  assert.equal(pointerSource.includes("is-walking-puppy"), true);
  assert.equal(sequenceSource.includes("is-puppy-playing"), true);
});

test("walking puppy flips left and right without changing overlay offsets", () => {
  const styles = fs.readFileSync("styles.css", "utf8");
  const pointerSource = fs.readFileSync("src/controllers/friend-pointer-controller.js", "utf8");

  assert.equal(pointerSource.includes("walkingFacing"), true);
  assert.equal(pointerSource.includes("movementDelta"), true);
  assert.equal(pointerSource.includes('walkingFacing = "left"'), true);
  assert.equal(pointerSource.includes('walkingFacing = "right"'), true);
  assert.equal(pointerSource.includes("syncPuppyFacing"), true);
  assert.equal(styles.includes(".friend-character.is-facing-left .friend-character-art"), true);
  assert.equal(styles.includes("transform: scaleX(-1) scale(0.5)"), true);
  assert.equal(styles.includes("left: -20px"), true);
  assert.equal(styles.includes("left: 30px"), true);
});

test("double-tap plays only ukuleleActivated while snap plays only uke", () => {
  const pointerSource = fs.readFileSync("src/controllers/friend-pointer-controller.js", "utf8");
  const worldSource = fs.readFileSync("src/controllers/world-friend-controller.js", "utf8");
  const gameRulesSource = fs.readFileSync("src/controllers/game-rules-controller.js", "utf8");

  assert.equal(pointerSource.includes('playSfxClip?.("ukuleleActivated"'), true);
  assert.equal(pointerSource.includes('playSfxClip?.("uke"'), false);
  assert.equal(worldSource.includes('playSfxClip("uke", finishUkeDance)'), true);
  assert.equal(worldSource.includes('playSfxClip("ukuleleActivated", finishUkeDance)'), true);
  assert.equal(gameRulesSource.includes('playSfxClip?.("uke")'), false);
});

test("fast uke snap has a 3000ms particle and animation cap", () => {
  const worldSource = fs.readFileSync("src/controllers/world-friend-controller.js", "utf8");
  const styles = fs.readFileSync("styles.css", "utf8");

  assert.equal(worldSource.includes("ukeMusicStopTimer"), true);
  assert.equal(worldSource.includes("3000"), true);
  assert.equal(styles.includes("uke-snap-dance"), true);
  assert.equal(styles.includes("uke-snap-shake"), true);
});
