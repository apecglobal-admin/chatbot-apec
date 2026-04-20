/**
 * Seed script: Insert new permissions into the database.
 * Run with: npx tsx scripts/seed-permissions.ts
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import path from "path"

// Load .env manually (no dotenv dependency needed)
const envContent = readFileSync(path.resolve(process.cwd(), ".env"), "utf-8")
for (const line of envContent.split("\n")) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) continue
  const eqIdx = trimmed.indexOf("=")
  if (eqIdx > 0) {
    process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim()
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const NEW_PERMISSIONS = [
  { name: "Thêm ngành hàng", key: "department:create" },
  { name: "Xóa ngành hàng", key: "department:delete" },
  { name: "Xem nhân sự", key: "staff:read" },
  { name: "Thêm nhân sự", key: "staff:create" },
  { name: "Sửa nhân sự", key: "staff:update" },
  { name: "Xóa nhân sự", key: "staff:delete" },
  { name: "Phân quyền", key: "roles:manage" },
]

async function main() {
  console.log("🔄 Seeding permissions...")

  for (const perm of NEW_PERMISSIONS) {
    // Upsert: skip if key already exists
    const { data, error } = await supabase
      .from("permissions")
      .upsert(perm, { onConflict: "key" })
      .select()

    if (error) {
      console.error(`❌ Failed to insert "${perm.key}":`, error.message)
    } else {
      console.log(`✅ ${perm.key} → ${perm.name}`)
    }
  }

  // Show all permissions
  const { data: all } = await supabase.from("permissions").select("id, key, name").order("id")
  console.log("\n📋 All permissions in DB:")
  console.table(all)
}

main().catch(console.error)
