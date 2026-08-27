import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load repo-root .env when present (local `pnpm run db:migrate` without exporting vars).
const rootEnvPath = resolve(__dirname, "../../../.env");
if (existsSync(rootEnvPath)) {
  for (const line of readFileSync(rootEnvPath, "utf-8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Point it at your Supabase Postgres connection string.");
}

const migrationPaths = [
  join(__dirname, "..", "migrations", "001_init_schema.sql"),
  resolve(__dirname, "../../../db/migrations/002_event_ledger.sql"),
  resolve(__dirname, "../../../db/migrations/003_batch_metrics.sql"),
  resolve(__dirname, "../../../db/migrations/004_tenant_scope.sql"),
  resolve(__dirname, "../../../db/migrations/005_feed_inventory.sql"),
  resolve(__dirname, "../../../db/migrations/006_performance_finance.sql"),
  resolve(__dirname, "../../../db/migrations/007_rbac_rls.sql"),
];

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  for (const migrationPath of migrationPaths) {
    const version = migrationPath.split(/[\\/]/).pop();
    const applied = await pool.query(
      "SELECT 1 FROM public.schema_migrations WHERE version = $1",
      [version],
    );
    if (applied.rowCount) {
      console.log(`Skipping ${version} (already applied).`);
      continue;
    }
    console.log(`Applying ${migrationPath}...`);
    await pool.query("BEGIN");
    try {
      await pool.query(readFileSync(migrationPath, "utf-8"));
      await pool.query("INSERT INTO public.schema_migrations (version) VALUES ($1)", [version]);
      await pool.query("COMMIT");
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  }
  console.log("Migrations applied.");
} finally {
  await pool.end();
}
