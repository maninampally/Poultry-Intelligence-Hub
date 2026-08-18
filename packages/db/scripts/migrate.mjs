import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Point it at your Supabase Postgres connection string.");
}

const migrationPath = join(__dirname, "..", "migrations", "001_init_schema.sql");
const sql = readFileSync(migrationPath, "utf-8");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  console.log(`Applying ${migrationPath}...`);
  await pool.query(sql);
  console.log("Migration applied.");
} finally {
  await pool.end();
}
