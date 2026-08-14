import path from "node:path";
import type { HarnessConfig } from "../schemas/harness-config.schema.js";

export interface SerializedFile {
  relativePath: string;
  content: string;
}

export class OpenCodeSerializer {
  public static serialize(config: HarnessConfig): SerializedFile[] {
    const files: SerializedFile[] = [];

    // 1. Generate opencode.json
    files.push({
      relativePath: "opencode.json",
      content: JSON.stringify(this.generateConfigJson(config), null, 2),
    });

    // 2. Generate opencode.md
    files.push({
      relativePath: "opencode.md",
      content: this.generateProjectMd(config),
    });

    // 3. Generate Scoped Subagent Personas
    files.push(...this.generateAgentPersonas(config));

    return files;
  }

  private static generateConfigJson(config: HarnessConfig): Record<string, any> {
    const isOrchestrated = config.workflowMode === "orchestrated";

    // Build subagent allowlist based on stack & mode
    const taskPermissions: Record<string, string> = {
      "*": "deny",
    };

    if (isOrchestrated) {
      taskPermissions["test-creator"] = "allow";
      taskPermissions["test-runner"] = "allow";
      taskPermissions["code-reviewer"] = "allow";

      if (config.stack === "react-native") {
        taskPermissions["react-native-developer"] = "allow";
        taskPermissions["design-reviewer"] = "allow";
      } else if (config.stack === "react-web") {
        taskPermissions["web-developer"] = "allow";
        taskPermissions["design-reviewer"] = "allow";
      } else if (config.stack === "go") {
        taskPermissions["go-developer"] = "allow";
      } else if (config.stack === "node") {
        taskPermissions["node-developer"] = "allow";
      }

      if (config.taskBackend.type === "linear") {
        taskPermissions["po-agent"] = "allow";
      }
    }

    return {
      "$schema": "https://opencode.ai/config.json",
      "instructions": [
        ".harness/standards/**/summary.md",
        ".harness/spec/app-summary.md",
        "opencode.md"
      ],
      "provider": {
        "type": config.provider.type,
        "model": config.provider.model,
        ...(config.provider.baseUrl ? { "baseUrl": config.provider.baseUrl } : {}),
        "options": {
          "promptCaching": config.provider.promptCaching
        }
      },
      "agent": {
        "architect": {
          "mode": "primary",
          "permission": {
            "task": taskPermissions,
            "external_directory": "deny"
          }
        }
      }
    };
  }

  private static generateProjectMd(config: HarnessConfig): string {
    return [
      `# Project: ${config.projectName}`,
      "",
      `> **Stack:** ${config.stack}`,
      `> **Workflow Mode:** ${config.workflowMode}`,
      `> **Task Backend:** ${config.taskBackend.type}`,
      "",
      "## Operational Discipline",
      "1. **Context Loading (2-Level Cache):**",
      "   - Always read `.harness/spec/app-summary.md` first.",
      "   - Drill down to `.harness/spec/features/<feature>/README.md` only when working on that feature.",
      "   - Load sub-specs (`business/`, `ui/`, `technical/`) only when actively implementing.",
      "",
      "2. **Task Execution Boundary:**",
      "   - Read the active task manifest at `.harness/tasks/task-XXX.md`.",
      "   - You must ONLY modify files listed under `## 1. Allowed File Boundaries` in the task manifest.",
      "   - Preflight verification and exit-0 tests are mandatory before marking any task as done.",
      "",
      "3. **Deterministic Commands:**",
      `   - Test: \`${config.commands.test}\``,
      `   - Lint: \`${config.commands.lint}\``,
      ...(config.commands.typecheck ? [`   - Typecheck: \`${config.commands.typecheck}\``] : []),
    ].join("\n");
  }

  private static generateAgentPersonas(config: HarnessConfig): SerializedFile[] {
    const files: SerializedFile[] = [];

    // Test Runner Persona
    files.push({
      relativePath: path.join(".opencode", "agents", "test-runner.md"),
      content: [
        "---",
        "description: Executes verification, test suites, and linters without editing application code.",
        "mode: subagent",
        "permission:",
        "  edit: deny",
        "  bash: allow",
        "  task: deny",
        "  external_directory: deny",
        "---",
        "",
        "# Role: Test Runner",
        "You execute build, test, and lint commands. Return only verbatim results and compressed error cards.",
      ].join("\n"),
    });

    // Code Reviewer Persona
    files.push({
      relativePath: path.join(".opencode", "agents", "code-reviewer.md"),
      content: [
        "---",
        "description: Read-only reviewer checking diffs against architectural standards and security rules.",
        "mode: subagent",
        "permission:",
        "  edit: deny",
        "  bash: ask",
        "  task: deny",
        "  external_directory: deny",
        "---",
        "",
        "# Role: Code Reviewer",
        "Inspect the git diff against acceptance criteria. End your review with either:",
        "`## VERDICT: APPROVE` or `## VERDICT: REJECT`.",
      ].join("\n"),
    });

    return files;
  }
}