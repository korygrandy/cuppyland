const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  analyzeTestSource,
  analyzeTestSuite,
  writeAuditArtifacts,
} = require("../scripts/test-manager-audit");

test("analyzeTestSource flags structural include-heavy tests for enhancement", () => {
  const source = `
    const fs = require("node:fs");
    test("sample", () => {
      const a = fs.readFileSync("x.js", "utf8");
      assert.equal(a.includes("abc"), true);
      assert.equal(a.includes("def"), true);
      assert.equal(a.includes("ghi"), true);
      assert.equal(a.includes("jkl"), true);
      assert.equal(a.includes("mno"), true);
    });
  `;
  const result = analyzeTestSource("sample.test.js", source);
  assert.equal(result.classification, "candidate-low-value");
  assert.equal(result.risk, "high");
});

test("analyzeTestSuite returns summary and details", () => {
  const report = analyzeTestSuite();
  assert.ok(report.summary.totalFiles > 0);
  assert.ok(report.summary.totalTests > 0);
  assert.equal(Array.isArray(report.details), true);
});

test("writeAuditArtifacts writes JSON and HTML outputs", () => {
  const report = analyzeTestSuite();
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-manager-audit-"));
  const files = writeAuditArtifacts(report, outputDir);
  assert.equal(fs.existsSync(files.jsonPath), true);
  assert.equal(fs.existsSync(files.htmlPath), true);
  const html = fs.readFileSync(files.htmlPath, "utf8");
  assert.equal(html.includes("Test Manager Audit Dashboard"), true);
});
