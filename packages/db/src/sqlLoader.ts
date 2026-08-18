import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./client";

// apps/api bundles this package with esbuild, which rewrites import.meta.url
// to point at the bundled output file instead of this source file. The build
// injects __DB_QUERIES_ROOT__ via esbuild `define` so the real queries/ dir
// can still be found at runtime. Under tsx (scripts) or tsc (typecheck) this
// global is never defined, so we fall back to a path relative to this file.
declare global {
  const __DB_QUERIES_ROOT__: string | undefined;
}

function resolveQueriesRoot(): string {
  if (typeof __DB_QUERIES_ROOT__ !== "undefined") return __DB_QUERIES_ROOT__;
  return join(dirname(fileURLToPath(import.meta.url)), "..", "queries");
}

const queriesRoot = resolveQueriesRoot();
const sqlCache = new Map<string, string>();

function loadSql(relativePath: string): string {
  const cached = sqlCache.get(relativePath);
  if (cached !== undefined) return cached;
  const text = readFileSync(join(queriesRoot, relativePath), "utf-8");
  sqlCache.set(relativePath, text);
  return text;
}

export async function runQuery<T = any>(
  relativePath: string,
  params: unknown[] = [],
): Promise<T[]> {
  const text = loadSql(relativePath);
  const result = await pool.query(text, params as any[]);
  return result.rows as T[];
}
