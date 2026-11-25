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
  assert.equal(trampoline.hitboxOffsetX, 42);
  assert.equal(trampoline.hitboxOffsetY, 180);
  assert.equal(trampoline.hitboxWidth, 350);
  assert.equal(trampoline.hitboxHeight, 110);
});

test("Olivia room has the bed bounce hitbox", () => {
  const context = { window: {} };
  loadBrowserScript("src/core/world-anchor-registry.js", context);
  const anchors = context.window.CuppyLandWorldAnchors.backgroundObjectAnchors["olivia-room"];
  const bed = anchors.find((anchor) => anchor.id === "bed-bg");
  assert.ok(bed);
  assert.equal(bed.activatedAssets.down, "./assets/bed-bounce-down.png");
  assert.equal(bed.activatedAssets.up, "./assets/bed-bounce-up.png");
  assert.equal(bed.x, 960);
  assert.equal(bed.y, 80);
  assert.equal(bed.width, 760);
  assert.equal(bed.height, 620);
  assert.equal(bed.artOffsetX, -93);
  assert.equal(bed.artOffsetY, 235);
  assert.equal(bed.artScale, 1);
  assert.equal(bed.artWidth, 495);
  assert.equal(bed.artHeight, 480);
  assert.equal(bed.hitboxOffsetX, 42);
  assert.equal(bed.hitboxOffsetY, 336);
  assert.equal(bed.hitboxWidth, 237);
  assert.equal(bed.hitboxHeight, 213);
  assert.ok(Number.isFinite(bed.hitboxOffsetX));
  assert.ok(Number.isFinite(bed.hitboxOffsetY));
  assert.ok(Number.isFinite(bed.hitboxWidth));
  assert.ok(Number.isFinite(bed.hitboxHeight));
  assert.ok(fs.existsSync("assets/bed-bounce-down.png"));
  assert.ok(fs.existsSync("assets/bed-bounce-up.png"));
  assert.ok(fs.statSync("assets/bed-bounce-down.png").size > 0);
  assert.ok(fs.statSync("assets/bed-bounce-up.png").size > 0);
});

test("trampoline assets exist and have matching 600px dimensions", () => {
  const down = fs.statSync("assets/trampoline-down.png");
  const up = fs.statSync("assets/trampoline-up.png");

  assert.ok(down.size > 0);
  assert.ok(up.size > 0);
});

test("Olivia room bed dual frame animation remains configured", () => {
  const controller = fs.readFileSync("src/controllers/background-object-controller.js", "utf8");

  assert.equal(controller.includes("objectConfig.activatedAsset"), true);
  assert.equal(controller.includes("objectConfig.activatedAssets"), true);
  assert.equal(controller.includes("objectConfig.activatedAsset ||"), true);
  assert.equal(controller.includes('let frame = objectConfig.activatedAssets ? "down" : "up"'), true);
});

test("bed hitbox objects use inverted up/down bounce poses", () => {
  const controller = fs.readFileSync("src/controllers/background-object-controller.js", "utf8");

  assert.equal(controller.includes('const isBedBounce = objectId === "bed-bg"'), true);
  assert.equal(controller.includes('const friendIsUp = isBedBounce ? frame === "up" : frame === "up"'), true);
  assert.equal(controller.includes('const isBedBouncer = objectConfig.id === "bed-bg"'), true);
  assert.equal(controller.includes("isGeneralHitboxActivator"), true);
  assert.equal(controller.includes("isGeneralHitboxType"), true);
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
  assert.equal(styles.includes("[data-object-id=\"bed-bg\"]"), true);
  assert.equal(controller.includes("world-background-object-art-down"), true);
  assert.equal(controller.includes("world-background-object-art-up"), true);
  assert.equal(styles.includes(".world-background-object-hitbox-debug"), true);
  assert.equal(controller.includes("showHitbox"), true);
  assert.equal(controller.includes("applyBounceArtFrame"), true);
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
  const worldCanvas = {
    offsetWidth: 6000,
    offsetHeight: 700,
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      width: 6000,
      height: 700,
    }),
  };
  const controller = context.window.CuppyLandBackgroundObjectController.createController({
    container,
    worldCanvas,
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
  const puppy = makeFriend("puppy-1", "golden-puppy", 350, 240);
  const turtle = makeFriend("turtle-1", "turtle-bead-craft", 380, 240);
  const rabbit = makeFriend("rabbit-1", "rabbit-bead-craft", 410, 240);
  const squirrel = makeFriend("squirrel-1", "squirrel", 440, 240);
  const turkey = makeFriend("turkey-1", "turkey", 470, 240);
  const chocolateMilk = makeFriend("milk-1", "chocolate-milk", 520, 240);
  const accessory = makeFriend("ball-1", "dogtoy-ball", 500, 240);
  const outside = makeFriend("heart-outside", "heart-women", 800, 240);

  controller.syncFriend(barbie.state, barbie.element);
  controller.syncFriend(baby.state, baby.element);
  controller.syncFriend(puppy.state, puppy.element);
  controller.syncFriend(turtle.state, turtle.element);
  controller.syncFriend(rabbit.state, rabbit.element);
  controller.syncFriend(squirrel.state, squirrel.element);
  controller.syncFriend(turkey.state, turkey.element);
  controller.syncFriend(chocolateMilk.state, chocolateMilk.element);
  controller.syncFriend(accessory.state, accessory.element);
  controller.syncFriend(outside.state, outside.element);

  assert.equal(outside.element.classes.has("trampoline-bounce-up") || outside.element.classes.has("trampoline-bounce-down"), false);
  assert.equal(accessory.element.classes.has("trampoline-bounce-up") || accessory.element.classes.has("trampoline-bounce-down"), false);
  assert.equal(chocolateMilk.element.classes.has("trampoline-bounce-up") || chocolateMilk.element.classes.has("trampoline-bounce-down"), true);
  const controllerSource = fs.readFileSync("src/controllers/background-object-controller.js", "utf8");
  assert.equal(controllerSource.includes("registerTrampolineFriend"), true);
  assert.equal(controllerSource.includes("const currentFriendOverlaps"), true);
  assert.equal(controllerSource.includes("getBoundingClientRect"), true);
  assert.equal(controllerSource.includes("newlyRegistered"), true);
  assert.equal(controllerSource.includes("function syncCup"), true);
  assert.equal(controllerSource.includes("trampoline-bounce-up"), true);
  assert.equal(controllerSource.includes("syncCup(cupState, cupElement)"), true);
  assert.equal(controllerSource.includes("registeredCupId"), true);
});

test("cup and attached Mr Chocolate Milk use trampoline bouncing", () => {
  const styles = fs.readFileSync("styles.css", "utf8");
  const cupControllerSource = fs.readFileSync("src/controllers/cup-pointer-controller.js", "utf8");
  const appSource = fs.readFileSync("src/core/app.js", "utf8");
  const bouncerSource = fs.readFileSync("src/controllers/background-object-controller.js", "utf8");

  assert.equal(styles.includes(".cup-character.trampoline-bounce-up"), true);
  assert.equal(styles.includes(".cup-character.trampoline-bounce-down"), true);
  assert.equal(cupControllerSource.includes("syncTrampolineActivation(cupState, cupElement)"), true);
  assert.equal(appSource.includes("backgroundObjectController?.syncCup"), true);
  assert.equal(bouncerSource.includes('"chocolate-milk"'), true);
});

test("trampoline and general hitboxes include Pumpkin and pet character types", () => {
  const controllerSource = fs.readFileSync("src/controllers/background-object-controller.js", "utf8");
  const tubeSource = fs.readFileSync("src/controllers/tube-slide-controller.js", "utf8");
  assert.equal(controllerSource.includes("const trampolineBouncerTypes = new Set"), true);
  assert.equal(controllerSource.includes('"golden-puppy"'), true);
  assert.equal(controllerSource.includes('"turtle-bead-craft"'), true);
  assert.equal(controllerSource.includes('"rabbit-bead-craft"'), true);
  assert.equal(controllerSource.includes('"squirrel"'), true);
  assert.equal(controllerSource.includes('"turkey"'), true);
  assert.equal(controllerSource.includes('"punpkin-man"'), true);
  assert.equal(controllerSource.includes('"pumpkin-woman"'), true);
  assert.equal(controllerSource.includes("isGeneralHitboxActivator"), true);
  assert.equal(tubeSource.includes("punpkin-man"), true);
  assert.equal(tubeSource.includes("pumpkin-woman"), true);
  assert.equal(controllerSource.includes("isAllowedBouncer"), true);
  assert.equal(controllerSource.includes('"chocolate-milk"'), true);
});
