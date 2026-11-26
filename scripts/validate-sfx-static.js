const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

function loadBrowserScript(relativePath, context) {
  const source = fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
  vm.runInNewContext(source, context, { filename: relativePath });
}

function collectDirectClipReferences(sourceRoot) {
  const references = new Set();
  const root = path.join(projectRoot, sourceRoot);
  const sourceFiles = [];

  function walk(directory) {
    fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
      } else if (entry.isFile() && entry.name.endsWith(".js")) {
        sourceFiles.push(entryPath);
      }
    });
  }

  walk(root);
  sourceFiles.forEach((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    const pattern = /playSfxClip(?:\?\.)?\s*(?:\?\.?\s*)?\(\s*["']([A-Za-z0-9_-]+)["']/g;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      references.add(match[1]);
    }
  });
  return references;
}

function validate() {
  const context = { window: {} };
  loadBrowserScript("src/core/world-anchor-registry.js", context);
  loadBrowserScript("src/core/game-config.js", context);
  loadBrowserScript("src/core/object-sfx-trigger-registry.js", context);

  const game = context.window.CuppyLandGame;
  const registry = context.window.CuppyLandObjectSfxTriggerRegistry;
  const clips = game?.audioConfig?.sfxClips || {};
  const errors = [];

  Object.entries(clips).forEach(([clipName, relativePath]) => {
    if (typeof relativePath !== "string" || !relativePath.startsWith("./")) {
      errors.push(`Invalid configured path for ${clipName}: ${String(relativePath)}`);
      return;
    }
    const absolutePath = path.join(projectRoot, relativePath.replace(/^\.\//, ""));
    if (!fs.existsSync(absolutePath)) {
      errors.push(`Missing SFX file for ${clipName}: ${relativePath}`);
    }
  });

  if (registry) {
    const registryValidation = registry.validate(clips);
    registryValidation.errors.forEach((error) => errors.push(error));
  } else {
    errors.push("Missing CuppyLandObjectSfxTriggerRegistry");
  }

  collectDirectClipReferences("src").forEach((clipName) => {
    if (!Object.prototype.hasOwnProperty.call(clips, clipName)) {
      errors.push(`Direct SFX call references missing clip key: ${clipName}`);
    }
  });

  const themes = game?.audioConfig?.worlds || {};
  [game?.audioConfig?.menu, themes.playground, themes["olivia-room"]]
    .filter(Boolean)
    .forEach((relativePath) => {
      const absolutePath = path.join(projectRoot, relativePath.replace(/^\.\//, ""));
      if (!fs.existsSync(absolutePath)) {
        errors.push(`Missing music/theme file: ${relativePath}`);
      }
    });

  return {
    valid: errors.length === 0,
    clipCount: Object.keys(clips).length,
    directReferenceCount: collectDirectClipReferences("src").size,
    errors,
  };
}

if (require.main === module) {
  const result = validate();
  if (result.valid) {
    console.log(`SFX static validation passed: ${result.clipCount} clips, ${result.directReferenceCount} direct references.`);
  } else {
    console.error(`SFX static validation failed with ${result.errors.length} issue(s):`);
    result.errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
  }
}

module.exports = {
  validate,
};
