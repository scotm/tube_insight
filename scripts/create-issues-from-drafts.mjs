#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const file = "docs/issue-drafts.md";
const md = readFileSync(file, "utf8");

const sections = [];
const lines = md.split(/\r?\n/);
let current = null;
for (const line of lines) {
	const m = line.match(/^##\s+(.+)$/);
	if (m) {
		if (current) sections.push(current);
		let title = m[1].trim();
		// Strip leading numbering like "1) "
		title = title.replace(/^\d+\)\s+/, "");
		current = { title, body: "" };
	} else if (current) {
		current.body += line + "\n";
	}
}
if (current) sections.push(current);

if (sections.length === 0) {
	console.error("No issue sections found in", file);
	process.exit(1);
}

// Verify gh auth
const auth = spawnSync("gh", ["auth", "status"], { stdio: "inherit" });
if (auth.status !== 0) {
	console.error("GitHub CLI not authenticated. Please run 'gh auth login'.");
	process.exit(auth.status ?? 1);
}

for (const { title, body } of sections) {
	console.log(`\nCreating issue: ${title}`);
	const res = spawnSync(
		"gh",
		["issue", "create", "--title", title, "--body", body],
		{ stdio: "inherit" },
	);
	if (res.status !== 0) {
		console.error("Failed to create issue:", title);
		process.exit(res.status ?? 1);
	}
}

console.log("\nAll issues created successfully.");
