const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { loadBrowserScript } = require("./test-helpers");

test("Baby Mr Chocolate Milk composite remains available outside inventory", () => {
  const context = {
    window: {
      CuppyLandGame: {
        tintAssetConfig: { lid: "./assets/lid-grayscale.png", cup: "./assets/cup-grayscale.png" },
        sleeveAssetMap: { child: "./assets/sleeve-child.png" },
        expressionAssetMap: { happy: "./assets/facial-expression-happy.png" },
        hairstyleAssetMap: { child: "./assets/hairstyle-child.svg" },
        defaultSleeveAsset: "./assets/sleeve-child.png",
        colorMap: { yellow: "#ffd94d", red: "#3e80ff" },
      },
    },
    document: {
      createElement: (tagName) => ({
        tagName,
        className: "",
        width: 0,
        height: 0,
        style: {},
        appendChild() {},
      }),
    },
  };
  loadBrowserScript("src/controllers/baby-chocolate-milk-composite.js", context);
  const composite = context.window.CuppyLandBabyChocolateMilkComposite;
  const classes = [];
  const friendElement = {
    appendChild: (node) => classes.push(node.className),
  };
  composite.appendComposite(friendElement);
  assert.deepEqual(classes, [
    "baby-mr-chocolate-milk-cup-base",
    "baby-mr-chocolate-milk-cup-sleeve",
    "baby-mr-chocolate-milk-cup-lid",
    "baby-mr-chocolate-milk-face",
    "baby-mr-chocolate-milk-hairstyle",
  ]);
});

test("world friend controller delegates Baby Mr Chocolate Milk rendering", () => {
  const controller = fs.readFileSync("src/controllers/world-friend-controller.js", "utf8");
  const index = fs.readFileSync("index.html", "utf8");
  assert.equal(controller.includes("CuppyLandBabyChocolateMilkComposite?.appendComposite"), true);
  assert.equal(controller.includes("CuppyLandBabyChocolateMilkComposite?.sync"), true);
  assert.equal(index.includes("baby-chocolate-milk-composite.js"), true);
});
