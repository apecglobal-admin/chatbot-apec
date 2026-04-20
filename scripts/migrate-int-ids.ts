/**
 * Migration: Convert roles & permissions IDs from UUID to SERIAL INT.
 * Run with: npx tsx scripts/migrate-int-ids.ts
 */

import { readFileSync } from "fs"
import path from "path"

// Load .env
const envContent = readFileSync(path.resolve(process.cwd(), ".env"), "utf-8")
for (const line of envContent.split("\n")) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) continue
  const eqIdx = trimmed.indexOf("=")
  if (eqIdx > 0) {
    process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim()
  }
}

const dbUrl = process.env.SUPABASE_DB_URL
if (!dbUrl) {
  console.error("❌ Missing SUPABASE_DB_URL in .env")
  process.exit(1)
}

async function main() {
  // Dynamic import pg
  const { default: pg } = await import("pg")
  const client = new pg.Client({ connectionString: dbUrl })

  try {
    await client.connect()
    console.log("✅ Connected to database\n")

    const sql = readFileSync(
      path.resolve(process.cwd(), "scripts/migration-int-ids.sql"),
      "utf-8"
    )

    console.log("🔄 Running migration...")
    await client.query(sql)
    console.log("✅ Migration completed successfully!\n")

    // Verify
    const perms = await client.query("SELECT id, key, name FROM permissions ORDER BY id")
    console.log("📋 Permissions:")
    console.table(perms.rows)

    const roles = await client.query("SELECT id, name FROM roles ORDER BY id")
    console.log("📋 Roles:")
    console.table(roles.rows)

  } catch (err: any) {
    console.error("❌ Migration failed:", err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
