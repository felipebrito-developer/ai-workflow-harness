import { z } from "zod";

export const TaskModeSchema = z.enum(["VARIANT_A", "VARIANT_B"]);
export const TaskStatusSchema = z.enum([
	"TODO",
	"IN_PROGRESS",
	"BLOCKED",
	"DONE",
]);
export const TaskTypeSchema = z.enum(["task", "research", "spike"]);

export const TaskFrontmatterSchema = z.object({
	id: z.string().regex(/^task-[a-z0-9-]+$/, "Format must be task-XXX"),
	title: z.string().min(3),
	status: TaskStatusSchema.default("TODO"),
	mode: TaskModeSchema.default("VARIANT_A"),
	feature_ref: z.string().min(1),
	depends_on: z.array(z.string()).default([]),
	type: TaskTypeSchema.default("task"),
});

function isTestFile(filePath: string): boolean {
	const lower = filePath.toLowerCase();
	return (
		lower.includes(".test.") ||
		lower.includes(".spec.") ||
		lower.endsWith("_test.go") ||
		lower.includes("/tests/") ||
		lower.includes("/__tests__/")
	);
}

export const TaskManifestSchema = z
	.object({
		frontmatter: TaskFrontmatterSchema,
		allowedFiles: z.array(z.string()),
		acceptanceCriteria: z
			.array(z.string())
			.min(1, "At least one acceptance criterion is required")
			.max(4, "At most 4 acceptance criteria"),
		verificationCommands: z
			.array(z.string())
			.min(1, "At least one verification command is required"),
	})
	.superRefine((data, ctx) => {
		const type = data.frontmatter.type || "task";
		if (type === "task") {
			if (data.allowedFiles.length === 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message:
						"At least one allowed file boundary must be declared for standard tasks",
					path: ["allowedFiles"],
				});
			}

			const testFiles = data.allowedFiles.filter(isTestFile);
			const codeFiles = data.allowedFiles.filter((f) => !isTestFile(f));

			if (codeFiles.length > 2) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "At most 2 implementation code files allowed for standard tasks",
					path: ["allowedFiles"],
				});
			}
			if (testFiles.length > 1) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "At most 1 test spec file allowed for standard tasks",
					path: ["allowedFiles"],
				});
			}
			if (data.allowedFiles.length > 3) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message:
						"Task boundary invariant violated: allowedFiles must contain max 2 code files + 1 test file (max 3 total)",
					path: ["allowedFiles"],
				});
			}

			if (data.verificationCommands.length === 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message:
						"At least one verification command is required for standard tasks",
					path: ["verificationCommands"],
				});
			}
		} else if (type === "spike") {
			if (data.allowedFiles.length === 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message:
						"At least one allowed file boundary must be declared for spike tasks",
					path: ["allowedFiles"],
				});
			}
			if (data.allowedFiles.length > 5) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "At most 5 allowed files for spike tasks",
					path: ["allowedFiles"],
				});
			}
		} else if (type === "research") {
			if (data.allowedFiles.length > 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Research tasks must not have allowed files",
					path: ["allowedFiles"],
				});
			}
		}
	});

export type TaskManifest = z.infer<typeof TaskManifestSchema>;
export type TaskFrontmatter = z.infer<typeof TaskFrontmatterSchema>;
