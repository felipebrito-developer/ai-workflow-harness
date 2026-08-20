#!/usr/bin/env bun
import { Command } from "commander";
import { runAnalyze } from "./commands/analyze.js";
import { runAudit } from "./commands/audit.js";
import { runCheckpoint } from "./commands/checkpoint.js";
import { runClose } from "./commands/close.js";
import { runFeature } from "./commands/feature.js";
import { runInit } from "./commands/init.js";
import { runPreflight } from "./commands/preflight.js";
import { runStart } from "./commands/start.js";
import { runVerify } from "./commands/verify.js";

const program = new Command();

program
  .name("harness")
  .description("Standardized, Token-Efficient AI Development Framework")
  .version("1.0.0");

program
  .command("init")
  .description("Initialize .harness framework in the current repository")
  .action(runInit);

program
  .command("analyze")
  .description("Run Brownfield Zero-Prompt auto-discovery & seed SQLite specs")
  .action(runAnalyze);

program
  .command("audit")
  .description("Run security secret leak scan and dependency vulnerability checks")
  .action(runAudit);

program
  .command("feature <name>")
  .description("Generate 1-pass Agile feature specs, mockup, contract & atomic tasks")
  .option("-f, --files <files>", "Comma-separated list of target files")
  .option("-s, --isSchema", "Mark if task alters database schema or API contract")
  .action((name, options) => runFeature(name, options));

program
  .command("start <taskId>")
  .description("Switch to isolated branch and mark task IN_PROGRESS")
  .action(runStart);

program
  .command("preflight <taskId>")
  .description("Run AST validation, secret diff scan, and generate agent echo contract")
  .action(runPreflight);

program
  .command("verify <taskId>")
  .description("Execute deterministic tests/linter with circuit breaker & vibe mode auto-expansion")
  .action(runVerify);

program
  .command("checkpoint <taskId>")
  .description("Stash uncommitted diffs for Delta Protocol scope triage")
  .action(runCheckpoint);

program
  .command("close <taskId>")
  .description("Validate boundaries, mark task DONE, export SQLite specs & record spawn log")
  .action(runClose);

program.parse(process.argv);