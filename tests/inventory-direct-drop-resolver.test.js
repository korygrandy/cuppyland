const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { loadBrowserScript } = require("./test-helpers");

function createResolverElement(type, id) {
  return {
    dataset: { friendId: id, friendType: type },
    getBoundingClientRect: () => ({ left: 10, right: 110, top: 10, bottom: 110 }),
  };
}

test("inventory direct drop resolver preserves Baby Mr Chocolate Milk part drops", () => {
  const context = { window: {}, document: {} };
  loadBrowserScript("src/controllers/inventory-direct-drop-resolver.js", context);
  const baby = createResolverElement("baby-mr-chocolate-milk", "baby-1");
  let call = null;
  const resolver = context.window.CuppyLandInventoryDirectDropResolver.createController({
    documentRef: {
      elementFromPoint: () => ({
        closest: (selector) => selector.includes("baby-mr-chocolate-milk") ? baby : null,
      }),
    },
    onDirectBabyMilkPart: (id, type, value) => {
      call = { id, type, value };
      return true;
    },
  });

  const result = resolver.resolve(
    { clientX: 50, clientY: 50 },
    { active: true, type: "lid", value: "yellow" }
  );
  assert.equal(result.handled, true);
  assert.deepEqual(call, { id: "baby-1", type: "lid", value: "yellow" });
});

test("inventory direct drop resolver handles fishbowl water source drops", () => {
  const context = { window: {}, document: {} };
  loadBrowserScript("src/controllers/inventory-direct-drop-resolver.js", context);
  const bowl = createResolverElement("water-bowl", "bowl-1");
  let call = null;
  const resolver = context.window.CuppyLandInventoryDirectDropResolver.createController({
    documentRef: {
      elementFromPoint: () => ({
        closest: (selector) => selector.includes("water-bowl") ? bowl : null,
      }),
    },
    onDirectWaterSource: (id, sourceType) => {
      call = { id, sourceType };
      return true;
    },
  });

  const result = resolver.resolve(
    { clientX: 50, clientY: 50 },
    { active: true, type: "friend", value: "fishbowl" }
  );
  assert.equal(result.handled, true);
  assert.deepEqual(call, { id: "bowl-1", sourceType: "fishbowl" });
});

test("inventory controller uses direct drop resolver", () => {
  const controller = fs.readFileSync("src/controllers/inventory-interaction-controller.js", "utf8");
  const inventory = fs.readFileSync("index.html", "utf8");
  assert.equal(controller.includes("CuppyLandInventoryDirectDropResolver"), true);
  assert.equal(controller.includes("directDropResolver?.resolve"), true);
  assert.equal(inventory.includes("inventory-direct-drop-resolver.js"), true);
});
