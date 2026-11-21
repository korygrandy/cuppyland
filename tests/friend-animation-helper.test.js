const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./test-helpers");

test("friend animation helper toggles pizza wobble and detects animation states", () => {
  const context = { window: {} };
  loadBrowserScript("src/controllers/friend-animation-helper.js", context);
  const helper = context.window.CuppyLandFriendAnimationHelper;

  const uke = { type: "uke", ukeDancing: true };
  const pizza = { type: "pizza-man-craft", pizzaWobbleActive: false };

  assert.equal(helper.isUkeDancing(uke), true);
  assert.equal(helper.isPizzaWobbling(pizza), false);
  assert.equal(helper.togglePizzaWobble(pizza), true);
  assert.equal(helper.isPizzaWobbling(pizza), true);
  assert.equal(helper.togglePizzaWobble({ type: "golden-puppy" }), false);
});
