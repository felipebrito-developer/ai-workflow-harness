import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { SpecDatabase } from "../src/engines/spec-database.js";

describe("SpecDatabase Engine", () => {
  const testHarnessDir = path.join(process.cwd(), ".harness-test-db");

  beforeAll(async () => {
    await fs.mkdir(testHarnessDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(testHarnessDir, { recursive: true, force: true });
  });

  it("should initialize schema and insert/query feature and topic chunks", async () => {
    const specDb = new SpecDatabase(testHarnessDir);

    specDb.upsertFeature({
      id: "feat-test",
      name: "Test Feature",
      slug: "test-feature",
      summary: "A test feature for unit testing",
      status: "STABLE",
    });

    specDb.upsertTopic({
      id: "topic-test",
      feature_id: "feat-test",
      category: "technical",
      slug: "test-topic",
      title: "Test Topic Title",
    });

    specDb.upsertChunk({
      id: "chunk-test-summary",
      topic_id: "topic-test",
      level: "summary",
      content: "Test summary content chunk",
      token_estimate: 10,
    });

    const summaryContent = specDb.getTopicChunk("test-topic", "summary");
    expect(summaryContent).toBe("Test summary content chunk");

    await specDb.exportToMarkdown(testHarnessDir);
    const appSummaryRaw = await fs.readFile(path.join(testHarnessDir, "spec", "app-summary.md"), "utf-8");
    expect(appSummaryRaw).toContain("Test Feature");

    specDb.close();
  });
});
