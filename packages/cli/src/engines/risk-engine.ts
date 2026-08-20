import chalk from "chalk";

export interface TaskRiskAssessment {
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH";
  reasons: string[];
  recommendedSlices?: string[];
}

export class RiskEngine {
  public static evaluateTaskRisk(
    files: string[],
    isSchemaMutation: boolean = false,
    verificationCmdsCount: number = 1
  ): TaskRiskAssessment {
    let score = 0;
    const reasons: string[] = [];

    // File count weight
    if (files.length > 5) {
      score += 4;
      reasons.push(`Touches ${files.length} files (exceeds recommended 2-file limit)`);
    } else if (files.length > 2) {
      score += 2;
      reasons.push(`Touches ${files.length} files (exceeds 2-file ideal scope)`);
    }

    // Schema mutation weight
    if (isSchemaMutation) {
      score += 3;
      reasons.push("Modifies database schema / API data contract");
    }

    // Command verification complexity
    if (verificationCmdsCount > 3) {
      score += 2;
      reasons.push("Requires >3 multi-tier verification commands");
    }

    const level: "LOW" | "MEDIUM" | "HIGH" = score >= 5 ? "HIGH" : score >= 3 ? "MEDIUM" : "LOW";

    const assessment: TaskRiskAssessment = {
      score,
      level,
      reasons,
    };

    if (level === "HIGH") {
      assessment.recommendedSlices = [
        "task-XXXa-schema (DDL / Type Contract Migration)",
        "task-XXXb-impl (Core Business Logic)",
      ];
    }

    return assessment;
  }

  public static formatRiskCard(assessment: TaskRiskAssessment): string {
    const color = assessment.level === "HIGH" ? chalk.red : assessment.level === "MEDIUM" ? chalk.yellow : chalk.green;
    const lines = [
      color("┌────────────────────────────────────────────────────────┐"),
      color(`│ ⚠️ TASK RISK ASSESSMENT: LEVEL ${assessment.level.padEnd(23)}│`),
      color("├────────────────────────────────────────────────────────┤"),
    ];

    for (const reason of assessment.reasons) {
      lines.push(color(`│ • ${reason.slice(0, 52).padEnd(52)}│`));
    }

    if (assessment.recommendedSlices && assessment.recommendedSlices.length > 0) {
      lines.push(color("├────────────────────────────────────────────────────────┤"));
      lines.push(color("│ Recommended Sub-Slices:                                │"));
      for (const slice of assessment.recommendedSlices) {
        lines.push(color(`│   -> ${slice.slice(0, 48).padEnd(48)}│`));
      }
    }

    lines.push(color("└────────────────────────────────────────────────────────┘"));
    return lines.join("\n");
  }
}
