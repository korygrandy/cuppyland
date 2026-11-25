const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { loadBrowserScript } = require("./test-helpers");

test("Chocolate Milk type helper covers normal and Baby placeholder types", () => {
  const context = { window: {} };
  loadBrowserScript("src/core/chocolate-milk-type-helper.js", context);
  const helper = context.window.CuppyLandChocolateMilkTypes;
  assert.equal(helper.isChocolateMilkType("chocolate-milk"), true);
  assert.equal(helper.isChocolateMilkType("baby-mr-chocolate-milk"), true);
  assert.equal(helper.isChocolateMilkType("puppy"), false);
  assert.equal(helper.isBabyChocolateMilkType("baby-mr-chocolate-milk"), true);
  assert.equal(helper.normalizeChocolateMilkType("baby-mr-chocolate-milk"), "baby-mr-chocolate-milk");
  assert.equal(helper.normalizeChocolateMilkType("chocolate-milk"), "chocolate-milk");
});

test("Chocolate Milk controllers load shared type helper", () => {
  const index = fs.readFileSync("index.html", "utf8");
  const spill = fs.readFileSync("src/controllers/chocolate-milk-spill-helper.js", "utf8");
  const sequence = fs.readFileSync("src/controllers/chocolate-milk-sequence-controller.js", "utf8");
  assert.equal(index.includes("chocolate-milk-type-helper.js"), true);
  assert.equal(spill.includes("CuppyLandChocolateMilkTypes?.isChocolateMilkType"), true);
  assert.equal(sequence.includes("CuppyLandChocolateMilkTypes?.isChocolateMilkType"), true);
});
