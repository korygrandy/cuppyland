const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./test-helpers");

test("rectsOverlap detects overlap in both directions", () => {
  const context = { window: {} };
  loadBrowserScript("src/interaction/friend-overlap-helper.js", context);

  assert.equal(context.window.CuppyLandFriendOverlap.rectsOverlap(
    { left: 10, right: 30, top: 10, bottom: 30 },
    { left: 25, right: 50, top: 25, bottom: 50 }
  ), true);
  assert.equal(context.window.CuppyLandFriendOverlap.rectsOverlap(
    { left: 10, right: 30, top: 10, bottom: 30 },
    { left: 31, right: 50, top: 31, bottom: 50 }
  ), false);
});
