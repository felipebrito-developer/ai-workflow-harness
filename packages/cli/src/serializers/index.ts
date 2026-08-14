import fs from "node:fs/promises";
import path from "node:path";
import type { HarnessConfig } from "../schemas/harness-config.schema.js";
import { OpenCodeSerializer, type SerializedFile } from "./opencode-serializer.js";
import { AntigravitySerializer } from "./antigravity-serializer.js";

export class AdapterCompiler {
  public static async compileAll(
    config: HarnessConfig,
    targetDirectory: string = process.cwd()
  ): Promise<string[]> {
    const filesToWrite: SerializedFile[] = [];

    if (config.adapters.includes("opencode")) {
      filesToWrite.push(...OpenCodeSerializer.serialize(config));
    }

    if (config.adapters.includes("antigravity")) {
      filesToWrite.push(...AntigravitySerializer.serialize(config));
    }

    const writtenFiles: string[] = [];

    for (const file of filesToWrite) {
      const destination = path.resolve(targetDirectory, file.relativePath);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, file.content, "utf-8");
      writtenFiles.push(file.relativePath);
    }

    return writtenFiles;
  }
}

export * from "./opencode-serializer.js";
export * from "./antigravity-serializer.js";