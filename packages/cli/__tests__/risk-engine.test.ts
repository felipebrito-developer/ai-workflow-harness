import { describe, expect, it } from "bun:test";
import { RiskEngine } from "../src/engines/risk-engine.js";

describe("RiskEngine", () => {
  it("should evaluate low risk for <= 2 files without schema mutation", () => {
    const risk = RiskEngine.evaluateTaskRisk(["src/index.ts", "tests/index.test.ts"], false);
    expect(risk.level).toBe("LOW");
    expect(risk.score).toBe(0);
  });

  it("should evaluate high risk for > 5 files with schema mutation", () => {
    const files = ["a.ts", "b.ts", "c.ts", "d.ts", "e.ts", "f.ts"];
    const risk = RiskEngine.evaluateTaskRisk(files, true);
    expect(risk.level).toBe("HIGH");
    expect(risk.score).toBeGreaterThanOrEqual(5);
    expect(risk.recommendedSlices).toBeDefined();
    expect(risk.recommendedSlices!.length).toBeGreaterThan(0);
  });
});
