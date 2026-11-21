const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./test-helpers");

test("interaction registry maps toy types and Barbie types", () => {
  const context = { window: {} };
  loadBrowserScript("src/core/interaction-rule-registry.js", context);
  const rules = context.window.CuppyLandInteractionRules;

  assert.equal(rules.getToySequenceType("dogbone"), "bone");
  assert.equal(rules.getToySequenceType("rope-dogtoy"), "rope");
  assert.equal(rules.getToySequenceType("dogtoy-ball"), "ball");
  assert.equal(rules.getToySequenceType("squirrel"), "squirrel");
  assert.equal(rules.isBarbieType("barbie-blonde"), true);
  assert.equal(rules.isBarbieType("barbie-blonde-baby"), true);
  assert.equal(rules.isPuppyType("golden-puppy"), true);
});
