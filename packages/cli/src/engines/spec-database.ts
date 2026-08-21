import { Database } from "bun:sqlite";
import fs from "node:fs/promises";
import path from "node:path";

export interface SpecFeature {
	id: string;
	name: string;
	slug: string;
	summary: string;
	status: "DRAFT" | "STABLE" | "DEPRECATED";
}

export interface SpecTopic {
	id: string;
	feature_id: string;
	category: "business" | "ui" | "technical" | "pipeline";
	slug: string;
	title: string;
	parent_topic_id?: string;
}

export interface SpecChunk {
	id: string;
	topic_id: string;
	level: "summary" | "detail";
	content: string;
	token_estimate: number;
}

export interface SpecTask {
	id: string;
	spec_id: string;
	status: "TODO" | "IN_PROGRESS" | "VERIFYING" | "DONE";
	allowed_files: string;
	acceptance_criteria: string;
}

export class SpecDatabase {
	private db: Database;
	private dbPath: string;

	constructor(harnessDir: string) {
		this.dbPath = path.join(harnessDir, "harness.db");
		this.db = new Database(this.dbPath, { create: true });
		this.db.exec("PRAGMA journal_mode = WAL;");
		this.initSchema();
	}

	public initSchema(): void {
		this.db.exec(`
      CREATE TABLE IF NOT EXISTS features (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        summary TEXT NOT NULL,
        status TEXT DEFAULT 'DRAFT',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS spec_topics (
        id TEXT PRIMARY KEY,
        feature_id TEXT NOT NULL REFERENCES features(id) ON DELETE CASCADE,
        category TEXT CHECK(category IN ('business', 'ui', 'technical', 'pipeline')),
        slug TEXT NOT NULL,
        title TEXT NOT NULL,
        parent_topic_id TEXT REFERENCES spec_topics(id) ON DELETE SET NULL,
        UNIQUE(feature_id, slug)
      );

      CREATE TABLE IF NOT EXISTS spec_chunks (
        id TEXT PRIMARY KEY,
        topic_id TEXT NOT NULL REFERENCES spec_topics(id) ON DELETE CASCADE,
        level TEXT CHECK(level IN ('summary', 'detail')) NOT NULL,
        content TEXT NOT NULL,
        token_estimate INTEGER NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(topic_id, level)
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        spec_id TEXT REFERENCES features(id),
        status TEXT CHECK(status IN ('TODO', 'IN_PROGRESS', 'VERIFYING', 'DONE')),
        allowed_files TEXT NOT NULL,
        acceptance_criteria TEXT NOT NULL
      );
    `);
	}

	public upsertFeature(feature: SpecFeature): void {
		const stmt = this.db.prepare(`
      INSERT INTO features (id, name, slug, summary, status)
      VALUES ($id, $name, $slug, $summary, $status)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        summary=excluded.summary,
        status=excluded.status
    `);
		stmt.run({
			$id: feature.id,
			$name: feature.name,
			$slug: feature.slug,
			$summary: feature.summary,
			$status: feature.status,
		});
	}

	public upsertTopic(topic: SpecTopic): void {
		const stmt = this.db.prepare(`
      INSERT INTO spec_topics (id, feature_id, category, slug, title, parent_topic_id)
      VALUES ($id, $feature_id, $category, $slug, $title, $parent_topic_id)
      ON CONFLICT(feature_id, slug) DO UPDATE SET
        title=excluded.title,
        category=excluded.category
    `);
		stmt.run({
			$id: topic.id,
			$feature_id: topic.feature_id,
			$category: topic.category,
			$slug: topic.slug,
			$title: topic.title,
			$parent_topic_id: topic.parent_topic_id || null,
		});
	}

	public upsertChunk(chunk: SpecChunk): void {
		const stmt = this.db.prepare(`
      INSERT INTO spec_chunks (id, topic_id, level, content, token_estimate)
      VALUES ($id, $topic_id, $level, $content, $token_estimate)
      ON CONFLICT(topic_id, level) DO UPDATE SET
        content=excluded.content,
        token_estimate=excluded.token_estimate,
        updated_at=CURRENT_TIMESTAMP
    `);
		stmt.run({
			$id: chunk.id,
			$topic_id: chunk.topic_id,
			$level: chunk.level,
			$content: chunk.content,
			$token_estimate: chunk.token_estimate,
		});
	}

	public getTopicChunk(
		topicSlug: string,
		level: "summary" | "detail",
	): string | null {
		const query = this.db.prepare(`
      SELECT c.content FROM spec_chunks c
      JOIN spec_topics t ON c.topic_id = t.id
      WHERE t.slug = $topicSlug AND c.level = $level
    `);
		const res = query.get({ $topicSlug: topicSlug, $level: level }) as {
			content: string;
		} | null;
		return res ? res.content : null;
	}

	public async exportToMarkdown(harnessDir: string): Promise<void> {
		const specDir = path.join(harnessDir, "spec");
		await fs.mkdir(specDir, { recursive: true });

		// Export App Summary
		const features = this.db
			.prepare("SELECT * FROM features")
			.all() as SpecFeature[];
		const appSummaryLines = [
			"# Application Specification Summary",
			"",
			`> Auto-generated from .harness/harness.db — ${new Date().toISOString()}`,
			"",
			"## Registered Features",
			...features.map((f) => `- **${f.name}** (\`${f.slug}\`): ${f.summary}`),
		];
		await fs.writeFile(
			path.join(specDir, "app-summary.md"),
			appSummaryLines.join("\n"),
			"utf-8",
		);

		// Export Feature Directories
		for (const feat of features) {
			const featDir = path.join(specDir, "features", feat.slug);
			await fs.mkdir(featDir, { recursive: true });

			const featReadme = [
				`# Feature: ${feat.name}`,
				"",
				`> **Status:** ${feat.status}`,
				`> **Slug:** \`${feat.slug}\``,
				"",
				"## Overview",
				feat.summary,
				"",
				"## Sub-specs Structure",
				"- \`business/spec.md\` — Business requirements and user journeys",
				"- \`ui/spec.md\` — Component specifications and wireframes",
				"- \`technical/spec.md\` — API contracts, database schemas, and type definitions",
			].join("\n");
			await fs.writeFile(path.join(featDir, "README.md"), featReadme, "utf-8");

			const chunks = this.db
				.prepare(`
        SELECT t.category, t.title, c.level, c.content 
        FROM spec_chunks c
        JOIN spec_topics t ON c.topic_id = t.id
        WHERE t.feature_id = $featId
      `)
				.all({ $featId: feat.id }) as {
				category: string;
				title: string;
				level: string;
				content: string;
			}[];

			for (const cat of ["business", "ui", "technical"] as const) {
				const catChunks = chunks.filter((c) => c.category === cat);
				if (catChunks.length > 0) {
					const catDir = path.join(featDir, cat);
					await fs.mkdir(catDir, { recursive: true });
					const mdContent = catChunks
						.map((c) => `### ${c.title} (${c.level})\n\n${c.content}`)
						.join("\n\n---\n\n");
					await fs.writeFile(path.join(catDir, "spec.md"), mdContent, "utf-8");
				}
			}
		}
	}

	public transaction<T>(fn: () => T): () => T {
		return this.db.transaction(fn);
	}

	public upsertTask(task: SpecTask): void {
		const stmt = this.db.prepare(`
      INSERT INTO tasks (id, spec_id, status, allowed_files, acceptance_criteria)
      VALUES ($id, $spec_id, $status, $allowed_files, $acceptance_criteria)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        allowed_files=excluded.allowed_files,
        acceptance_criteria=excluded.acceptance_criteria
    `);
		stmt.run({
			$id: task.id,
			$spec_id: task.spec_id,
			$status: task.status,
			$allowed_files: task.allowed_files,
			$acceptance_criteria: task.acceptance_criteria,
		});
	}

	public updateTaskStatus(
		taskId: string,
		status: "TODO" | "IN_PROGRESS" | "VERIFYING" | "DONE",
	): void {
		const stmt = this.db.prepare(`
      UPDATE tasks SET status = $status WHERE id = $taskId
    `);
		stmt.run({
			$status: status,
			$taskId: taskId,
		});
	}

	public close(): void {
		this.db.close();
	}
}
