#!/usr/bin/env bun
import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runVerify } from "./commands/verify.js";

const program = new Command();

function validateTaskId(taskId: string): string {
	if (!/^[a-zA-Z0-9_-]+$/.test(taskId)) {
		console.error(
			"Error: Invalid task ID format. Must contain only alphanumeric characters, underscores, or hyphens.",
		);
		process.exit(1);
	}
	return taskId;
}

program
	.name("harness")
	.description("Lean 2-Mode AI Development Harness Meta-Framework")
	.version("1.0.0");

program
	.command("init")
	.description("Scaffold lean .harness/ framework and tool adapters")
	.action(runInit);

program
	.command("verify <taskId>")
	.description(
		"Verify task file boundaries, execute verification test suite, and update status",
	)
	.action((taskId) => runVerify(validateTaskId(taskId)));

program.parse(process.argv);
