const fs = require("node:fs");
const vm = require("node:vm");

function loadBrowserScript(relativePath, context = {}) {
  const source = fs.readFileSync(relativePath, "utf8");
  vm.runInNewContext(source, context, { filename: relativePath });
  return context;
}

module.exports = {
  loadBrowserScript,
};
