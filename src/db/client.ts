import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

type DB = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { __db?: DB };

function resolveSqlitePath(): string {
	const url = process.env.DATABASE_URL ?? "file:./dev.db";
	// Accept formats like "file:./dev.db" or plain path
	return url.startsWith("file:") ? url.slice("file:".length) : url;
}

export const db: DB =
	globalForDb.__db ?? drizzle(new Database(resolveSqlitePath()), { schema });

if (!globalForDb.__db) {
	globalForDb.__db = db;
}

export * as tables from "./schema";
