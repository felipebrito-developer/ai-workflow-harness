import fs from "node:fs/promises";
import path from "node:path";
import { Project, ScriptTarget } from "ts-morph";

export interface AstValidationResult {
	valid: boolean;
	errors: string[];
	exportedSymbols: string[];
}

export class AstValidator {
	private project: Project;

	constructor() {
		this.project = new Project({
			compilerOptions: {
				target: ScriptTarget.ESNext,
				allowJs: true,
				declaration: true,
				emitDeclarationOnly: true,
			},
			skipAddingFilesFromTsConfig: true,
		});
	}

	public async validateFiles(
		filePaths: string[],
	): Promise<AstValidationResult> {
		const errors: string[] = [];
		const exportedSymbols: string[] = [];

		for (const relPath of filePaths) {
			const absPath = path.resolve(process.cwd(), relPath);

			// Only parse TypeScript / JavaScript files for deep AST validation
			if (!/\.(ts|tsx|js|jsx)$/.test(relPath)) {
				try {
					await fs.access(absPath);
				} catch {
					// File does not exist yet (acceptable if it's a target to be created)
				}
				continue;
			}

			try {
				await fs.access(absPath);
			} catch {
				// Target file will be created by the task
				continue;
			}

			try {
				const sourceFile = this.project.addSourceFileAtPath(absPath);
				const diagnostics = sourceFile.getPreEmitDiagnostics();

				if (diagnostics.length > 0) {
					for (const diag of diagnostics) {
						const line = diag.getLineNumber() ?? 0;
						const message = diag.getMessageText();
						const text =
							typeof message === "string" ? message : message.getMessageText();
						errors.push(`${relPath}:${line} - ${text}`);
					}
				}

				// Collect exported interfaces, types, functions, and classes
				for (const [name] of sourceFile.getExportedDeclarations()) {
					exportedSymbols.push(`${relPath} -> ${name}`);
				}
			} catch (err: any) {
				errors.push(`${relPath}: Failed to parse AST - ${err.message}`);
			}
		}

		return {
			valid: errors.length === 0,
			errors,
			exportedSymbols,
		};
	}
}
