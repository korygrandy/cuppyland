const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./test-helpers");

test("puppy sequence guard helper blocks companion mutation during active sequence", () => {
  const context = { window: {} };
  loadBrowserScript("src/controllers/puppy-sequence-guard-helper.js", context);
  const helper = context.window.CuppyLandPuppySequenceGuardHelper;

  assert.equal(helper.canStartSequence({ sequenceActive: false }), true);
  assert.equal(helper.canStartSequence({ sequenceActive: true }), false);
  assert.equal(helper.canAttachCompanion({ sequenceActive: false }), true);
  assert.equal(helper.canAttachCompanion({ sequenceActive: true }), false);
  assert.equal(helper.shouldRenderCompanionOverlay({ sequenceActive: false }), true);
  assert.equal(helper.shouldRenderCompanionOverlay({ sequenceActive: true }), false);
});
