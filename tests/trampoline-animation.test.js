const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { loadBrowserScript } = require("./test-helpers");

test("trampoline anchor and assets are configured", () => {
  const context = { window: {} };
  loadBrowserScript("src/core/world-anchor-registry.js", context);
  const anchors = context.window.CuppyLandWorldAnchors.backgroundObjectAnchors.playground;
  const trampoline = anchors.find((anchor) => anchor.id === "trampoline");

  assert.ok(trampoline);
  assert.equal(trampoline.x, 230);
  assert.equal(trampoline.y, 240);
  assert.equal(trampoline.width, 440);
  assert.equal(trampoline.height, 370);
  assert.equal(trampoline.activatedAssets.down, "./assets/trampoline-down.png");
  assert.equal(trampoline.activatedAssets.up, "./assets/trampoline-up.png");
  assert.equal(trampoline.frameDurationMs, 420);
  assert.equal(trampoline.artOffsetX, -10);
  assert.equal(trampoline.artOffsetY, 100);
  assert.equal(trampoline.artScale, 1.425);
  assert.ok(trampoline.activatorTypes.includes("barbie-blonde"));
  assert.ok(trampoline.activatorTypes.includes("barbie-blonde-baby"));
});

test("trampoline assets exist and have matching 600px dimensions", () => {
  const down = fs.statSync("assets/trampoline-down.png");
  const up = fs.statSync("assets/trampoline-up.png");

  assert.ok(down.size > 0);
  assert.ok(up.size > 0);
});

test("trampoline CSS defines a down/up bounce and alignment hook", () => {
  const styles = fs.readFileSync("styles.css", "utf8");
  const controller = fs.readFileSync("src/controllers/background-object-controller.js", "utf8");

  assert.equal(styles.includes("[data-object-id=\"trampoline\"]"), true);
  assert.equal(styles.includes("@keyframes trampoline-bounce"), true);
  assert.equal(styles.includes("--trampoline-art-scale"), true);
  assert.equal(controller.includes("activatedAssets.down"), true);
  assert.equal(controller.includes("activatedAssets.up"), true);
});
