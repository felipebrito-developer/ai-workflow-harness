#!/usr/bin/env bun
import { Command } from "commander";
import { runCheckpoint } from "./commands/checkpoint.js";
import { runClose } from "./commands/close.js";
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
  .command("start <taskId>")
  .description("Switch to isolated branch and mark task IN_PROGRESS")
  .action(runStart);

program
  .command("preflight <taskId>")
  .description("Run AST validation and generate agent echo contract")
  .action(runPreflight);

program
  .command("verify <taskId>")
  .description("Execute deterministic tests/linter with circuit breaker")
  .action(runVerify);

program
  .command("checkpoint <taskId>")
  .description("Stash uncommitted diffs for Delta Protocol scope triage")
  .action(runCheckpoint);

program
  .command("close <taskId>")
  .description("Validate boundaries, mark task DONE, and record spawn log")
  .action(runClose);

program.parse(process.argv);