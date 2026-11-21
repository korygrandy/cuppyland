const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./test-helpers");

test("chocolate milk spill helper requires an open cup", () => {
  const context = { window: {} };
  loadBrowserScript("src/controllers/chocolate-milk-spill-helper.js", context);
  const helper = context.window.CuppyLandChocolateMilkSpillHelper;
  const chocolate = { type: "chocolate-milk" };

  assert.equal(helper.isCupOpen({ lidVisible: false, lidDetached: true }), true);
  assert.equal(helper.isCupOpen({ lidVisible: false, lidDetached: false }), true);
  assert.equal(helper.isCupOpen({ lidVisible: true, lidDetached: false }), false);
  assert.equal(helper.canStartSpill({ lidVisible: false }, chocolate), true);
  assert.equal(helper.canStartSpill({ lidVisible: true }, chocolate), false);
  assert.equal(helper.canStartSpill({ lidVisible: false }, null), false);
});

test("double-tap resolves the attached open cup", () => {
  const context = { window: {} };
  loadBrowserScript("src/controllers/chocolate-milk-spill-helper.js", context);
  const helper = context.window.CuppyLandChocolateMilkSpillHelper;

  assert.equal(helper.getDoubleTapCupId({ attachedCupId: "cup-1" }, null), "cup-1");
  assert.equal(helper.getDoubleTapCupId({ attachedCupId: "cup-1" }, "cup-2"), "cup-2");
  assert.equal(helper.getDoubleTapCupId({}, null), null);
});

test("reported chocolate milk scenarios are covered", () => {
  const context = { window: {} };
  loadBrowserScript("src/controllers/chocolate-milk-spill-helper.js", context);
  const helper = context.window.CuppyLandChocolateMilkSpillHelper;
  const chocolate = { type: "chocolate-milk", attachedCupId: "cup-filled" };
  const openCup = { lidVisible: false, lidDetached: true, filled: false };
  const filledOpenCup = { lidVisible: false, lidDetached: true, filled: true };
  const closedCup = { lidVisible: true, lidDetached: false, filled: false };

  const lidOffThenDoubleTap = helper.isCupOpen(openCup) && Boolean(helper.getDoubleTapCupId(chocolate, "cup-filled"));
  const filledThenDoubleTap = helper.isCupOpen(filledOpenCup) && Boolean(helper.getDoubleTapCupId(chocolate, "cup-filled"));

  assert.equal(lidOffThenDoubleTap, true);
  assert.equal(filledThenDoubleTap, true);
  assert.equal(helper.isCupOpen(closedCup), false);
  assert.equal(helper.canStartSpill(closedCup, chocolate), false);
});
