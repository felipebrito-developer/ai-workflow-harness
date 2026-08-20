import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import { execaCommand } from "execa";

export interface SecurityIssue {
  type: "SECRET_LEAK" | "DEPENDENCY_VULN" | "UNPROTECTED_ENV";
  file?: string;
  summary: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
}

export class SecurityScanner {
  private static SECRET_PATTERNS = [
    { name: "API Secret/Token", pattern: /(api_key|apikey|secret_key|auth_token)\s*=\s*['"][A-Za-z0-9_\-]{12,}['"]/i },
    { name: "AWS Key", pattern: /AKIA[0-9A-Z]{16}/ },
    { name: "Private Key Header", pattern: /-----BEGIN (RSA|OPENSSH|PRIVATE) KEY-----/ },
    { name: "JWT Hardcoded Secret", pattern: /jwt\.sign\([^,]+,\s*['"][^'"]{4,}['"]/ },
    { name: "Hardcoded Password Variable", pattern: /(password|passwd|pwd)\s*=\s*['"][^'"]{4,}['"]/i },
  ];

  public static async scanDiffSecrets(diffText: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const lines = diffText.split("\n");

    let currentFile = "";
    for (const line of lines) {
      if (line.startsWith("+++ b/")) {
        currentFile = line.replace("+++ b/", "").trim();
        if (currentFile.endsWith(".env") || currentFile.includes(".env.")) {
          issues.push({
            type: "UNPROTECTED_ENV",
            file: currentFile,
            summary: `Attempting to commit environment file (${currentFile})`,
            severity: "CRITICAL",
          });
        }
      } else if (line.startsWith("+") && !line.startsWith("+++")) {
        const addedContent = line.slice(1);
        for (const rule of this.SECRET_PATTERNS) {
          if (rule.pattern.test(addedContent)) {
            issues.push({
              type: "SECRET_LEAK",
              file: currentFile,
              summary: `Potential secret leak detected (${rule.name})`,
              severity: "CRITICAL",
            });
          }
        }
      }
    }

    return issues;
  }

  public static async scanRepoSecrets(cwd: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    // Check for un-gitignored .env files
    const envPath = path.join(cwd, ".env");
    try {
      await fs.access(envPath);
      // Check if gitignored
      try {
        const { stdout } = await execaCommand("git check-ignore .env", { cwd });
        if (!stdout.includes(".env")) {
          issues.push({
            type: "UNPROTECTED_ENV",
            file: ".env",
            summary: ".env file exists in repository root and is NOT gitignored",
            severity: "CRITICAL",
          });
        }
      } catch {
        issues.push({
          type: "UNPROTECTED_ENV",
          file: ".env",
          summary: ".env file exists in repository root and is NOT gitignored",
          severity: "CRITICAL",
        });
      }
    } catch {}

    return issues;
  }

  public static async runDependencyAudit(cwd: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    // Node / Bun Audit
    try {
      await fs.access(path.join(cwd, "package.json"));
      try {
        const { stdout, stderr } = await execaCommand("bun audit", { cwd });
        if (stdout.includes("vulnerabilities found") || stderr.includes("vulnerabilities found")) {
          issues.push({
            type: "DEPENDENCY_VULN",
            summary: "Package vulnerabilities detected via bun audit. Run 'bun audit' to inspect.",
            severity: "HIGH",
          });
        }
      } catch (err: any) {
        const output = (err.stdout || "") + (err.stderr || "");
        if (output.includes("vulnerabilities found")) {
          issues.push({
            type: "DEPENDENCY_VULN",
            summary: "Package vulnerabilities detected via bun audit.",
            severity: "HIGH",
          });
        }
      }
    } catch {}

    // Go Audit
    try {
      await fs.access(path.join(cwd, "go.mod"));
      try {
        await execaCommand("govulncheck ./...", { cwd });
      } catch (err: any) {
        const output = (err.stdout || "") + (err.stderr || "");
        if (output.includes("VULNERABILITY")) {
          issues.push({
            type: "DEPENDENCY_VULN",
            summary: "Go package vulnerabilities detected via govulncheck.",
            severity: "HIGH",
          });
        }
      }
    } catch {}

    return issues;
  }

  public static formatSecurityCard(issues: SecurityIssue[]): string {
    const lines = [
      chalk.bold.red("┌────────────────────────────────────────────────────────┐"),
      chalk.bold.red("│ 🚨 HARNESS SECURITY ENGINE: VIOLATION DETECTED         │"),
      chalk.bold.red("├────────────────────────────────────────────────────────┤"),
    ];

    for (const issue of issues) {
      lines.push(
        chalk.red(`│ [${issue.severity}] ${issue.type.padEnd(16)} │ ${issue.summary.slice(0, 30).padEnd(30)}│`)
      );
      if (issue.file) {
        lines.push(chalk.dim(`│   Target File: ${issue.file.slice(0, 40).padEnd(40)}│`));
      }
    }

    lines.push(chalk.bold.red("└────────────────────────────────────────────────────────┘"));
    return lines.join("\n");
  }
}
