import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import {
  type TaskManifest,
  TaskManifestSchema,
} from "../schemas/task-manifest.schema.js";

export async function parseTaskManifest(filePath: string): Promise<TaskManifest> {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const rawContent = await fs.readFile(absolutePath, "utf-8");

  const { data: frontmatter, content: body } = matter(rawContent);

  // Extract Allowed File Boundaries
  const allowedFilesMatch = body.match(
    /##\s*1\.\s*Allowed File Boundaries[^\n]*\n([\s\S]*?)(?=##|$)/i
  );
  const allowedFiles: string[] = [];
  if (allowedFilesMatch) {
    const lines = allowedFilesMatch[1].split("\n");
    for (const line of lines) {
      const match = line.match(/^-\s*`?([^`\r\n]+)`?/);
      if (match) {
        allowedFiles.push(match[1].trim());
      }
    }
  }

  // Extract Acceptance Criteria
  const acMatch = body.match(
    /##\s*2\.\s*Acceptance Criteria[^\n]*\n([\s\S]*?)(?=##|$)/i
  );
  const acceptanceCriteria: string[] = [];
  if (acMatch) {
    const lines = acMatch[1].split("\n");
    for (const line of lines) {
      const match = line.match(/^-\s*\[([ xX])\]\s*(.+)/);
      if (match) {
        acceptanceCriteria.push(match[2].trim());
      }
    }
  }

  // Extract Verification Commands (from bash code blocks)
  const verifyMatch = body.match(
    /##\s*3\.\s*Verification Commands[^\n]*\n```(?:bash|sh)?\n([\s\S]*?)```/i
  );
  const verificationCommands: string[] = [];
  if (verifyMatch) {
    const commands = verifyMatch[1]
      .split("\n")
      .map((c) => c.trim())
      .filter((c) => c.length > 0 && !c.startsWith("#"));
    verificationCommands.push(...commands);
  }

  const rawManifest = {
    frontmatter,
    allowedFiles,
    acceptanceCriteria,
    verificationCommands,
  };

  const parsed = TaskManifestSchema.safeParse(rawManifest);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => ` - [${issue.path.join(".")}] ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid Task Manifest at ${filePath}:\n${formatted}`);
  }

  return parsed.data;
}