const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { loadBrowserScript } = require("./test-helpers");

test("tube slide is configured on playground panel 3", () => {
  const context = { window: {} };
  loadBrowserScript("src/core/world-anchor-registry.js", context);
  const anchors = context.window.CuppyLandWorldAnchors.backgroundObjectAnchors.playground;
  const tube = anchors.find((anchor) => anchor.id === "tube-slide");

  assert.ok(tube);
  assert.equal(tube.x, 4550);
  assert.equal(tube.y, 170);
  assert.equal(tube.hitboxWidth, 130);
  assert.equal(tube.hitboxHeight, 70);
  assert.equal(tube.hitboxOffsetX, 240);
  assert.equal(tube.reanchorOffsetX, 510);
  assert.equal(tube.reanchorOffsetY, 380);
  assert.equal(tube.reanchorWidth, 132);
  assert.equal(tube.reanchorHeight, 132);
});

test("tube slide pinch sequence and controller are wired", () => {
  const styles = fs.readFileSync("styles.css", "utf8");
  const controller = fs.readFileSync("src/controllers/tube-slide-controller.js", "utf8");
  const app = fs.readFileSync("src/core/app.js", "utf8");
  const index = fs.readFileSync("index.html", "utf8");

  assert.equal(styles.includes(".tube-slide-entering"), true);
  assert.equal(styles.includes(".tube-slide-exiting"), true);
  assert.equal(styles.includes("@keyframes tube-slide-pinched"), true);
  assert.equal(controller.includes("1650"), true);
  assert.equal(controller.includes("reanchorOffsetX"), true);
  assert.equal(controller.includes("reanchorOffsetY"), true);
  assert.equal(app.includes("tubeSlideController.syncFriend"), true);
  assert.equal(app.includes("tubeSlideController?.syncCup"), true);
  assert.equal(app.includes("tubeSlideController.render(worldId)"), true);
  assert.equal(index.includes("tube-slide-controller.js"), true);
});
