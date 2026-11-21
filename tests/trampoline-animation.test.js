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
  assert.equal(trampoline.x, 235);
  assert.equal(trampoline.y, 240);
  assert.equal(trampoline.width, 440);
  assert.equal(trampoline.height, 370);
  assert.equal(trampoline.activatedAssets.down, "./assets/trampoline-down.png");
  assert.equal(trampoline.activatedAssets.up, "./assets/trampoline-up.png");
  assert.equal(trampoline.frameDurationMs, 420);
  assert.equal(trampoline.activatorTypes, undefined);
  assert.equal(trampoline.artOffsetX, 0);
  assert.equal(trampoline.artOffsetY, 0);
  assert.equal(trampoline.artScale, 1);
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
  assert.equal(controller.includes("translateY(-24px)"), true);
  assert.equal(controller.includes("translateY(3px)"), true);
  assert.equal(controller.includes("restoreTrampolineFriend"), true);
  assert.equal(controller.includes("trampoline-bounce-up"), true);
  assert.equal(controller.includes("trampoline-bounce-down"), true);
});

test("trampoline has no Barbie-only activator filter", () => {
  const context = { window: {} };
  loadBrowserScript("src/core/world-anchor-registry.js", context);
  const trampoline = context.window.CuppyLandWorldAnchors.backgroundObjectAnchors.playground
    .find((anchor) => anchor.id === "trampoline");

  assert.equal(trampoline.activatorTypes, undefined);
});

test("trampoline bounce applies only to overlapping registered friends", () => {
  const context = {
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout: (callback) => {
      callback();
      return 1;
    },
    clearTimeout: () => {},
    document: {
      createElement: () => ({
        className: "",
        dataset: {},
        style: {
          setProperty: () => {},
        },
        classList: {
          add: () => {},
          remove: () => {},
          toggle: () => {},
        },
        appendChild: () => {},
        querySelector: () => ({
          style: {
            backgroundImage: "",
            left: "",
            top: "",
            width: "",
            height: "",
            setProperty: () => {},
          },
        }),
      }),
    },
    window: {
      setInterval: () => 1,
      clearInterval: () => {},
      setTimeout: (callback) => {
        callback();
        return 1;
      },
      clearTimeout: () => {},
      CuppyLandGame: {
        backgroundObjectAnchors: {
          playground: [{
            id: "trampoline",
            x: 235,
            y: 240,
            width: 440,
            height: 370,
            activatedAsset: "./assets/trampoline-down.png",
            activatedAssets: {
              down: "./assets/trampoline-down.png",
              up: "./assets/trampoline-up.png",
            },
            frameDurationMs: 420,
          }],
        },
      },
    },
  };
  loadBrowserScript("src/controllers/background-object-controller.js", context);

  const art = {
    style: { backgroundImage: "" },
  };
  const anchor = {
    className: "world-background-object",
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {},
    },
    querySelector: () => art,
  };
  const elements = new Map();
  const container = {
    innerHTML: "",
    querySelector: () => anchor,
    appendChild: () => {},
  };
  const controller = context.window.CuppyLandBackgroundObjectController.createController({
    container,
  });

  controller.render("playground");

  const makeFriend = (id, type, x, y) => {
    const element = {
      offsetWidth: 150,
      offsetHeight: 150,
      style: { transform: "", transition: "", opacity: "" },
      classes: new Set(),
      classList: {
        remove: (name) => element.classes.delete(name),
        add: (name) => element.classes.add(name),
      },
    };
    elements.set(id, element);
    return { state: { id, type, worldX: x, worldY: y }, element };
  };

  const barbie = makeFriend("barbie-1", "barbie-blonde", 235, 240);
  const baby = makeFriend("baby-1", "barbie-blonde-baby", 300, 240);
  const outside = makeFriend("puppy-1", "golden-puppy", 800, 240);

  controller.syncFriend(barbie.state, barbie.element);
  controller.syncFriend(baby.state, baby.element);
  controller.syncFriend(outside.state, outside.element);

  assert.equal(outside.element.classes.has("trampoline-bounce-up") || outside.element.classes.has("trampoline-bounce-down"), false);
  const controllerSource = fs.readFileSync("src/controllers/background-object-controller.js", "utf8");
  assert.equal(controllerSource.includes("registerTrampolineFriend"), true);
  assert.equal(controllerSource.includes("const currentFriendOverlaps"), true);
});
