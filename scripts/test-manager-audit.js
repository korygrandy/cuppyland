const fs = require("node:fs");
const path = require("node:path");

const TESTS_DIR = path.resolve(__dirname, "..", "tests");

function listTestFiles() {
  if (!fs.existsSync(TESTS_DIR)) {
    return [];
  }
  return fs.readdirSync(TESTS_DIR)
    .filter((name) => name.endsWith(".test.js"))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => path.join(TESTS_DIR, name));
}

function countMatches(source, regex) {
  const matches = source.match(regex);
  return matches ? matches.length : 0;
}

function analyzeTestSource(filePath, source) {
  const testCount = countMatches(source, /\btest\(/g);
  const includesAssertions = countMatches(source, /\.includes\(/g);
  const readFileSyncCalls = countMatches(source, /fs\.readFileSync\(/g);
  const loadBrowserScriptCalls = countMatches(source, /loadBrowserScript\(/g);
  const deepAssertions = countMatches(source, /assert\.(deepEqual|deepStrictEqual)\(/g);
  const edgeKeywords = countMatches(source, /\b(edge|bounds|outside|clamp|overlap|reanchor)\b/gi);

  const structuralOnly = readFileSyncCalls > 0 && includesAssertions > 0 && loadBrowserScriptCalls === 0;
  const behavioral = loadBrowserScriptCalls > 0 || deepAssertions > 0;

  let classification = "keep";
  let recommendation = "Keep as-is.";
  let risk = "low";

  if (structuralOnly && includesAssertions >= 4) {
    classification = "enhance";
    recommendation = "Convert structural string-include assertions to runtime behavior assertions where feasible.";
    risk = "medium";
  }
  if (testCount > 0 && includesAssertions > testCount * 2 && !behavioral) {
    classification = "candidate-low-value";
    recommendation = "Likely low-signal static coverage. Consider replacing with deterministic behavior tests.";
    risk = "high";
  }

  return {
    file: path.basename(filePath),
    path: filePath,
    testCount,
    includesAssertions,
    readFileSyncCalls,
    loadBrowserScriptCalls,
    deepAssertions,
    edgeKeywords,
    classification,
    risk,
    recommendation,
  };
}

function analyzeTestSuite() {
  const files = listTestFiles();
  const details = files.map((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    return analyzeTestSource(filePath, source);
  });

  const summary = {
    totalFiles: details.length,
    totalTests: details.reduce((sum, item) => sum + item.testCount, 0),
    structuralCandidates: details.filter((item) => item.classification === "candidate-low-value").length,
    enhanceCandidates: details.filter((item) => item.classification === "enhance").length,
    keepCount: details.filter((item) => item.classification === "keep").length,
  };

  const prioritized = details
    .filter((item) => item.classification !== "keep")
    .sort((a, b) => {
      const riskRank = { high: 3, medium: 2, low: 1 };
      return (riskRank[b.risk] - riskRank[a.risk])
        || (b.includesAssertions - a.includesAssertions)
        || a.file.localeCompare(b.file);
    });

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      tool: "test-manager-audit",
      version: 1,
    },
    summary,
    prioritized,
    details,
  };
}

function buildAuditDashboard(report) {
  const riskClass = (risk) => risk === "high" ? "risk-high" : risk === "medium" ? "risk-medium" : "risk-low";
  const rows = report.prioritized.map((item) => `
      <tr>
        <td>${item.file}</td>
        <td>${item.classification}</td>
        <td class="${riskClass(item.risk)}">${item.risk}</td>
        <td>${item.testCount}</td>
        <td>${item.includesAssertions}</td>
        <td>${item.loadBrowserScriptCalls}</td>
        <td>${item.deepAssertions}</td>
        <td>${item.recommendation}</td>
      </tr>`).join("");

  const detailRows = report.details.map((item) => `
      <tr>
        <td>${item.file}</td>
        <td>${item.classification}</td>
        <td>${item.risk}</td>
        <td>${item.testCount}</td>
        <td>${item.includesAssertions}</td>
        <td>${item.readFileSyncCalls}</td>
        <td>${item.loadBrowserScriptCalls}</td>
        <td>${item.deepAssertions}</td>
        <td>${item.edgeKeywords}</td>
      </tr>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Test Manager Audit Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #111827; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; }
    .risk-high { color: #b91c1c; font-weight: 700; }
    .risk-medium { color: #b45309; font-weight: 700; }
    .risk-low { color: #065f46; font-weight: 700; }
    .summary { margin-bottom: 16px; }
  </style>
</head>
<body>
  <h1>Test Manager Audit Dashboard</h1>
  <div class="summary">
    <div><strong>Total test files:</strong> ${report.summary.totalFiles}</div>
    <div><strong>Total tests:</strong> ${report.summary.totalTests}</div>
    <div><strong>Low-value candidates:</strong> ${report.summary.structuralCandidates}</div>
    <div><strong>Enhance candidates:</strong> ${report.summary.enhanceCandidates}</div>
  </div>
  <h2>Prioritized Recommendations</h2>
  <table>
    <thead>
      <tr><th>File</th><th>Classification</th><th>Risk</th><th>Tests</th><th>.includes</th><th>loadBrowserScript</th><th>deep asserts</th><th>Recommendation</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <h2>Full File Metrics</h2>
  <table>
    <thead>
      <tr><th>File</th><th>Classification</th><th>Risk</th><th>Tests</th><th>.includes</th><th>readFileSync</th><th>loadBrowserScript</th><th>deep asserts</th><th>Edge keywords</th></tr>
    </thead>
    <tbody>${detailRows}</tbody>
  </table>
</body>
</html>`;
}

function writeAuditArtifacts(report, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, "test-audit-report.json");
  const htmlPath = path.join(outputDir, "test-audit-dashboard.html");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(htmlPath, buildAuditDashboard(report));
  return { jsonPath, htmlPath };
}

if (require.main === module) {
  const outputDir = path.resolve(__dirname, "..", "reports", "test-manager", "latest");
  const report = analyzeTestSuite();
  const files = writeAuditArtifacts(report, outputDir);
  console.log(`Test audit complete. Files analyzed: ${report.summary.totalFiles}`);
  console.log(`JSON: ${files.jsonPath}`);
  console.log(`HTML: ${files.htmlPath}`);
}

module.exports = {
  analyzeTestSource,
  analyzeTestSuite,
  writeAuditArtifacts,
  buildAuditDashboard,
};
