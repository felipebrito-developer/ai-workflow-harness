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
  .description("Switch branch and mark task as IN_PROGRESS")
  .action(runStart);

program
  .command("preflight <taskId>")
  .description("Run preflight sanity checks and generate agent echo contract")
  .action(runPreflight);

program
  .command("verify <taskId>")
  .description("Execute deterministic test/lint runner with error sanitization")
  .action(runVerify);

program
  .command("checkpoint <taskId>")
  .description("Auto-stash uncommitted diffs for Delta Protocol scope escalation")
  .action(runCheckpoint);

program
  .command("close <taskId>")
  .description("Validate boundaries, mark task as DONE, and write spawn log receipt")
  .action(runClose);

program.parse(process.argv);