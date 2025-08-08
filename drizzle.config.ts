import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dialect: "sqlite",
	dbCredentials: {
		// Use DATABASE_URL if set, else local dev file
		url: process.env.DATABASE_URL ?? "file:./dev.db",
	},
});
