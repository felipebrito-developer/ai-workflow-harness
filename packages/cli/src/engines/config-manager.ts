import fs from "node:fs/promises";
import path from "node:path";
import {
	type HarnessConfig,
	HarnessConfigSchema,
} from "../schemas/harness-config.schema.js";

export class ConfigManager {
	private static cachedConfig: HarnessConfig | null = null;

	public static async load(): Promise<HarnessConfig> {
		if (ConfigManager.cachedConfig) {
			return ConfigManager.cachedConfig;
		}

		const configPath = path.join(
			process.cwd(),
			".harness",
			"harness.config.json",
		);
		try {
			const rawConfig = await fs.readFile(configPath, "utf-8");
			const parsed = JSON.parse(rawConfig);
			ConfigManager.cachedConfig = HarnessConfigSchema.parse(parsed);
			return ConfigManager.cachedConfig;
		} catch (err: any) {
			throw new Error(
				`Failed to load or validate harness.config.json: ${err.message}`,
			);
		}
	}
}
