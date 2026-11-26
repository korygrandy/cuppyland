const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

function loadBrowserScript(relativePath, context) {
  const source = fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
  vm.runInNewContext(source, context, { filename: relativePath });
}

function validateAnchors(worldAnchors = {}, errors = []) {
  Object.entries(worldAnchors).forEach(([worldId, anchors]) => {
    (anchors || []).forEach((anchor) => {
      const dimensions = [
        ["x", anchor.x],
        ["y", anchor.y],
        ["width", anchor.width],
        ["height", anchor.height],
      ];
      dimensions.forEach(([name, value]) => {
        if (!Number.isFinite(value)) {
          errors.push(`Anchor ${worldId}/${anchor.id} has invalid ${name}`);
        }
      });
      if ((anchor.width ?? 0) <= 0 || (anchor.height ?? 0) <= 0) {
        errors.push(`Anchor ${worldId}/${anchor.id} has non-positive dimensions`);
      }
      if (anchor.hitboxWidth !== undefined && (!Number.isFinite(anchor.hitboxWidth) || anchor.hitboxWidth <= 0)) {
        errors.push(`Anchor ${worldId}/${anchor.id} has invalid hitboxWidth`);
      }
      if (anchor.hitboxHeight !== undefined && (!Number.isFinite(anchor.hitboxHeight) || anchor.hitboxHeight <= 0)) {
        errors.push(`Anchor ${worldId}/${anchor.id} has invalid hitboxHeight`);
      }
      if (anchor.hitboxOffsetX !== undefined && !Number.isFinite(anchor.hitboxOffsetX)) {
        errors.push(`Anchor ${worldId}/${anchor.id} has invalid hitboxOffsetX`);
      }
      if (anchor.hitboxOffsetY !== undefined && !Number.isFinite(anchor.hitboxOffsetY)) {
        errors.push(`Anchor ${worldId}/${anchor.id} has invalid hitboxOffsetY`);
      }
    });
  });
}

function validateAssetPaths(manifestTriggers = [], errors = []) {
  manifestTriggers.forEach((trigger) => {
    (trigger.assets || []).forEach((assetPath) => {
      const absolute = path.join(projectRoot, assetPath.replace(/^\.\//, ""));
      if (!fs.existsSync(absolute)) {
        errors.push(`Trigger ${trigger.id} references missing asset ${assetPath}`);
      }
    });
  });
}

function validateRequiredCoverageFiles(errors = []) {
  const requiredFiles = [
    "tests/trigger-manifest.test.js",
    "tests/friend-edge-drag.test.js",
    "tests/friend-overlap-helper.test.js",
    "tests/friend-double-tap-controller.test.js",
    "tests/inventory-direct-drop-resolver.test.js",
    "tests/tube-slide.test.js",
  ];
  requiredFiles.forEach((relativePath) => {
    if (!fs.existsSync(path.join(projectRoot, relativePath))) {
      errors.push(`Missing required event coverage file ${relativePath}`);
    }
  });
}

function validate() {
  const context = { window: {} };
  loadBrowserScript("src/core/world-anchor-registry.js", context);
  loadBrowserScript("src/core/game-config.js", context);
  loadBrowserScript("src/core/trigger-manifest.js", context);
  loadBrowserScript("src/core/interaction-rule-registry.js", context);

  const game = context.window.CuppyLandGame || {};
  const triggerManifest = context.window.CuppyLandTriggerManifest;
  const errors = [];

  if (!triggerManifest) {
    errors.push("Missing CuppyLandTriggerManifest");
  }

  const triggerValidation = triggerManifest?.validate?.({
    worldAnchors: game.backgroundObjectAnchors,
    friendTypes: game.friendTypes,
    assetMap: game.friendAssetMap,
    sfxMap: game.audioConfig?.sfxClips || {},
    frameAssets: game.chocolateMilkSequence?.frameAssets || {},
  });

  if (!triggerValidation?.valid) {
    (triggerValidation?.errors || []).forEach((error) => errors.push(error));
  }

  validateAnchors(game.backgroundObjectAnchors || {}, errors);
  validateAssetPaths(triggerManifest?.triggers || [], errors);
  validateRequiredCoverageFiles(errors);

  return {
    valid: errors.length === 0,
    triggerCount: (triggerManifest?.triggers || []).length,
    worldCount: Object.keys(game.backgroundObjectAnchors || {}).length,
    errors,
  };
}

if (require.main === module) {
  const result = validate();
  if (result.valid) {
    console.log(`Event static validation passed: ${result.triggerCount} triggers across ${result.worldCount} world(s).`);
  } else {
    console.error(`Event static validation failed with ${result.errors.length} issue(s):`);
    result.errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
  }
}

module.exports = {
  validate,
};
