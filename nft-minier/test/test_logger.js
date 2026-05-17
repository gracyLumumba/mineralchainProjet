const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const BACKEND_DIR = path.resolve(__dirname, "..", "..", "backend-minier");
const EXPERIMENTS_DIR = path.join(BACKEND_DIR, "experiments");
const RAW_LOG_PATH = path.join(EXPERIMENTS_DIR, "experimentation_runs.jsonl");
const REBUILD_SCRIPT = path.join(BACKEND_DIR, "rebuild_experiment_exports.py");
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const VENV_PYTHON = path.join(PROJECT_ROOT, ".venv", "Scripts", "python.exe");
const PYTHON_EXE = fs.existsSync(VENV_PYTHON) ? VENV_PYTHON : "python";

function ensureDir() {
  fs.mkdirSync(EXPERIMENTS_DIR, { recursive: true });
}

function recordExperiment(entry) {
  ensureDir();
  const record = {
    recorded_at: new Date().toISOString(),
    test_name: entry.test_name || "Test blockchain",
    source: entry.source || "nft-minier.truffle",
    lot_id: entry.lot_id || "",
    site: entry.site || "",
    mineral_type: entry.mineral_type || "",
    http_status: entry.http_status ?? "",
    success: entry.success !== false,
    result_status: entry.result_status || "",
    already_validated: false,
    params_compared: entry.params_compared || 0,
    conformes: entry.conformes || 0,
    validated_by: entry.validated_by || "truffle",
    message: entry.message || "",
    error: entry.error || "",
    comparison: entry.comparison || [],
  };

  fs.appendFileSync(RAW_LOG_PATH, JSON.stringify(record) + "\n", "utf8");
  const rebuild = spawnSync(PYTHON_EXE, [REBUILD_SCRIPT], {
    cwd: BACKEND_DIR,
    encoding: "utf8",
  });
  if (rebuild.status !== 0) {
    console.warn("[TEST_LOGGER] rebuild_exports failed:", rebuild.stderr || rebuild.stdout);
  }
}

module.exports = { recordExperiment };
