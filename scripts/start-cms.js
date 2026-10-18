#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { runDevServer } = require("@decap/cli/dev");

const rootDir = process.cwd();
const isWin = process.platform === "win32";

console.log("\n=======================================================");
console.log(" Starting Local Eleventy Site + Decap CMS Proxy Server");
console.log("=======================================================\n");
console.log("  Site:  http://localhost:8080/");
console.log("  Admin: http://localhost:8080/admin/\n");

// Start decap-server proxy (port 8081)
runDevServer().catch((err) => {
  console.error("[CMS Proxy] Error:", err.message);
});

// Spawn eleventy --serve (port 8080)
const npxCmd = isWin ? "npx.cmd" : "npx";
const eleventyProcess = spawn(npxCmd, ["@11ty/eleventy", "--serve"], {
  cwd: rootDir,
  stdio: "inherit",
  shell: isWin,
});

function cleanup() {
  console.log("\nShutting down servers...");
  try {
    eleventyProcess.kill();
  } catch (e) {}
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
eleventyProcess.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.error(`[Eleventy] exited with code ${code}`);
  }
});

