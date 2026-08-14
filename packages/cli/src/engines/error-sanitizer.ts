export interface SanitizedErrorCard {
  failedCommand: string;
  summary: string;
  failureDetails: string[];
  cleanTrace: string;
}

export class ErrorSanitizer {
  /**
   * Cleans ANSI escape codes, strips node_modules / runtime internal stack traces,
   * and formats a compact failure report (<= 20 lines).
   */
  public static sanitize(command: string, rawStderr: string, rawStdout: string): SanitizedErrorCard {
    const rawOutput = `${rawStdout}\n${rawStderr}`;
    
    // Strip ANSI codes
    const cleanOutput = rawOutput.replace(
      /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
      ""
    );

    const lines = cleanOutput.split("\n").map((l) => l.trimEnd());
    const failureDetails: string[] = [];
    const traceLines: string[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      // Filter out internal stack traces & node_modules bloat
      if (
        line.includes("node_modules/") ||
        line.includes("node:internal/") ||
        line.includes("bun:internal/") ||
        line.includes("at Module._compile") ||
        line.includes("at process.processTicksAndRejections")
      ) {
        continue;
      }

      // Capture core failure signatures
      if (
        line.includes("FAIL") ||
        line.includes("Error:") ||
        line.includes("Expected:") ||
        line.includes("Received:") ||
        line.includes("✕") ||
        line.match(/\d+ failing/)
      ) {
        failureDetails.push(line);
      } else {
        traceLines.push(line);
      }
    }

    // Truncate clean trace to max 12 lines to protect context window
    const compactTrace = traceLines.slice(0, 12).join("\n");
    const summary = failureDetails[0] || "Command failed with non-zero exit code";

    return {
      failedCommand: command,
      summary,
      failureDetails: failureDetails.slice(0, 8),
      cleanTrace: compactTrace,
    };
  }

  public static formatErrorCard(card: SanitizedErrorCard): string {
    return [
      "┌────────────────────────────────────────────────────────┐",
      "│ [HARNESS VERIFICATION FAILURE REPORT]                  │",
      "├────────────────────────────────────────────────────────┤",
      ` Command: ${card.failedCommand}`,
      ` Summary: ${card.summary}`,
      " Details:",
      ...card.failureDetails.map((d) => `   - ${d}`),
      " Filtered Trace:",
      ...card.cleanTrace.split("\n").map((t) => `   | ${t}`),
      "└────────────────────────────────────────────────────────┘",
    ].join("\n");
  }
}