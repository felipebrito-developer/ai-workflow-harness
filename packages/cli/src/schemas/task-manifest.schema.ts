import { z } from "zod";

export const TaskModeSchema = z.enum(["VARIANT_A", "VARIANT_B"]);
export const TaskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]);

export const TaskFrontmatterSchema = z.object({
  id: z.string().regex(/^task-\d+$/, "Format must be task-XXX"),
  title: z.string().min(3),
  status: TaskStatusSchema.default("TODO"),
  mode: TaskModeSchema.default("VARIANT_A"),
  feature_ref: z.string().min(1),
  depends_on: z.array(z.string()).default([]),
});

export const TaskManifestSchema = z.object({
  frontmatter: TaskFrontmatterSchema,
  allowedFiles: z.array(z.string()).min(1, "At least one allowed file boundary must be declared").max(2, "At most 2 allowed files"),
  acceptanceCriteria: z.array(z.string()).min(1, "At least one acceptance criterion is required").max(4, "At most 4 acceptance criteria"),
  verificationCommands: z.array(z.string()).min(1, "At least one verification command is required"),
});

export type TaskManifest = z.infer<typeof TaskManifestSchema>;
export type TaskFrontmatter = z.infer<typeof TaskFrontmatterSchema>;