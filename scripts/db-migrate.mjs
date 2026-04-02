import { mkdir, readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { Client } from "pg"

const migrationsDir = path.join(process.cwd(), "supabase", "migrations")

const bootstrapMigrations = [
  {
    version: "20260331170000",
    name: "initial_chatbot_schema",
    sql: `
      create table if not exists public.store_settings (
        id text primary key,
        name text not null,
        subtitle text not null,
        support_phone text not null,
        created_at timestamptz not null default timezone('utc', now()),
        updated_at timestamptz not null default timezone('utc', now()),
        constraint store_settings_single_row check (id = 'default')
      );

      create table if not exists public.departments (
        id text primary key,
        slug text not null unique,
        name text not null,
        zone_label text not null,
        description text not null,
        welcome_message text not null,
        placeholder text not null,
        suggested_prompts jsonb not null default '[]'::jsonb,
        theme jsonb not null,
        assistant_slug text not null,
        api_endpoint text not null,
        api_key text not null default '',
        partner_user_prefix text not null default 'apec-shelf',
        request_timeout_ms integer not null default 20000,
        display_order integer not null default 0,
        is_active boolean not null default true,
        created_at timestamptz not null default timezone('utc', now()),
        updated_at timestamptz not null default timezone('utc', now()),
        constraint departments_timeout_check check (request_timeout_ms between 3000 and 60000),
        constraint departments_suggested_prompts_json check (jsonb_typeof(suggested_prompts) = 'array'),
        constraint departments_theme_json check (jsonb_typeof(theme) = 'object')
      );

      create or replace function public.set_updated_at()
      returns trigger
      language plpgsql
      as $$
      begin
        new.updated_at = timezone('utc', now());
        return new;
      end;
      $$;

      drop trigger if exists set_store_settings_updated_at on public.store_settings;
      create trigger set_store_settings_updated_at
      before update on public.store_settings
      for each row
      execute function public.set_updated_at();

      drop trigger if exists set_departments_updated_at on public.departments;
      create trigger set_departments_updated_at
      before update on public.departments
      for each row
      execute function public.set_updated_at();

      alter table public.store_settings enable row level security;
      alter table public.departments enable row level security;

      insert into public.store_settings (id, name, subtitle, support_phone)
      values (
        'default',
        'Apec Shelf AI',
        'Mỗi màn hình tại kệ là một trợ lý sản phẩm chuyên biệt.',
        '1900 6868'
      )
      on conflict (id) do update
      set
        name = excluded.name,
        subtitle = excluded.subtitle,
        support_phone = excluded.support_phone;

      insert into public.departments (
        id,
        slug,
        name,
        zone_label,
        description,
        welcome_message,
        placeholder,
        suggested_prompts,
        theme,
        assistant_slug,
        api_endpoint,
        api_key,
        partner_user_prefix,
        request_timeout_ms,
        display_order,
        is_active
      )
      values
        (
          'fresh-food',
          'thuc-pham-tuoi',
          'Thực phẩm tươi',
          'Kệ A1',
          'Rau củ, trái cây, thịt cá và gợi ý bảo quản tại quầy tươi.',
          'Xin chào, tôi phụ trách quầy Thực phẩm tươi. Bạn cần tìm sản phẩm, hỏi cách chọn hay bảo quản nguyên liệu nào?',
          'Ví dụ: Cá hồi hôm nay còn không? Bảo quản thịt bò thế nào?',
          '["Cá hồi hôm nay còn không?","Rau nào hợp để nấu canh chua?","Bảo quản thịt bò trong ngăn mát bao lâu?"]'::jsonb,
          '{"accent":"#2F855A","accentSoft":"#D7F5E4","panel":"#F4FAF6","surface":"#FFFFFF","userBubble":"#2F855A","assistantBubble":"#E8F4EC","badge":"#163E2D"}'::jsonb,
          'fresh-food',
          'https://rag-ai-jn9g.onrender.com/api/external/chat',
          '',
          'apec-shelf',
          20000,
          0,
          true
        ),
        (
          'beverages',
          'do-uong',
          'Đồ uống',
          'Kệ B3',
          'Nước giải khát, cà phê, trà và tư vấn ghép combo theo nhu cầu.',
          'Xin chào, tôi đang hỗ trợ tại quầy Đồ uống. Bạn muốn tìm đồ uống theo hương vị, thương hiệu hay dịp sử dụng?',
          'Ví dụ: Có nước ép ít đường không? Cà phê nào bán chạy?',
          '["Có loại nước ép ít đường nào?","Cà phê lon nào bán chạy?","Gợi ý combo nước cho tiệc 10 người."]'::jsonb,
          '{"accent":"#D97706","accentSoft":"#FFE6C7","panel":"#FFF8F0","surface":"#FFFFFF","userBubble":"#D97706","assistantBubble":"#FFF0DB","badge":"#7C2D12"}'::jsonb,
          'beverage',
          'https://rag-ai-jn9g.onrender.com/api/external/chat',
          '',
          'apec-shelf',
          20000,
          1,
          true
        ),
        (
          'household',
          'gia-dung',
          'Gia dụng',
          'Kệ C2',
          'Dụng cụ nhà bếp, đồ gia dụng nhanh và tư vấn sử dụng an toàn.',
          'Xin chào, tôi phụ trách quầy Gia dụng. Bạn muốn tìm sản phẩm nào cho bếp, vệ sinh hay tổ chức không gian sống?',
          'Ví dụ: Có hộp đựng thực phẩm chịu nhiệt không?',
          '["Có hộp đựng thực phẩm chịu nhiệt không?","Chảo chống dính nào phù hợp bếp từ?","Gợi ý bộ đồ lau dọn căn hộ nhỏ."]'::jsonb,
          '{"accent":"#0F766E","accentSoft":"#D6F5F1","panel":"#F2FBFA","surface":"#FFFFFF","userBubble":"#0F766E","assistantBubble":"#E1F6F3","badge":"#134E4A"}'::jsonb,
          'homeware',
          'https://rag-ai-jn9g.onrender.com/api/external/chat',
          '',
          'apec-shelf',
          20000,
          2,
          true
        ),
        (
          'beauty',
          'my-pham',
          'Mỹ phẩm',
          'Kệ D4',
          'Chăm sóc da, tóc và tư vấn routine cơ bản theo nhu cầu thường ngày.',
          'Xin chào, tôi là trợ lý quầy Mỹ phẩm. Bạn muốn tìm sản phẩm chăm sóc da, tóc hay quà tặng làm đẹp?',
          'Ví dụ: Da dầu nên chọn sữa rửa mặt nào?',
          '["Da dầu nên chọn sữa rửa mặt nào?","Có kem chống nắng cho da nhạy cảm không?","Gợi ý combo quà tặng chăm sóc da."]'::jsonb,
          '{"accent":"#BE185D","accentSoft":"#FFD7E8","panel":"#FFF3F8","surface":"#FFFFFF","userBubble":"#BE185D","assistantBubble":"#FFE3EF","badge":"#831843"}'::jsonb,
          'beauty',
          'https://rag-ai-jn9g.onrender.com/api/external/chat',
          '',
          'apec-shelf',
          20000,
          3,
          true
        )
      on conflict (id) do update
      set
        slug = excluded.slug,
        name = excluded.name,
        zone_label = excluded.zone_label,
        description = excluded.description,
        welcome_message = excluded.welcome_message,
        placeholder = excluded.placeholder,
        suggested_prompts = excluded.suggested_prompts,
        theme = excluded.theme,
        assistant_slug = excluded.assistant_slug,
        api_endpoint = excluded.api_endpoint,
        partner_user_prefix = excluded.partner_user_prefix,
        request_timeout_ms = excluded.request_timeout_ms,
        display_order = excluded.display_order,
        is_active = excluded.is_active;
    `,
  },
]

function parseMigrationFilename(filename) {
  const [version, ...nameParts] = filename.replace(".sql", "").split("_")
  return {
    version,
    name: nameParts.join("_") || filename.replace(".sql", ""),
  }
}

async function createNewMigration() {
  const name = process.argv[3]

  if (!name) {
    throw new Error("Hãy truyền tên migration, ví dụ: pnpm db:new-migration add-rls")
  }

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  if (!slug) {
    throw new Error("Tên migration không hợp lệ.")
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14)

  await mkdir(migrationsDir, { recursive: true })

  const filePath = path.join(migrationsDir, `${timestamp}_${slug}.sql`)
  await writeFile(filePath, "-- Write your migration here.\n", "utf8")

  process.stdout.write(`${filePath}\n`)
}

async function runMigrations() {
  const connectionString = process.env.SUPABASE_DB_URL

  if (!connectionString) {
    throw new Error("Thiếu SUPABASE_DB_URL. Hãy thêm biến này vào .env.local hoặc environment.")
  }

  await mkdir(migrationsDir, { recursive: true })

  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort()

  const fileMigrations = await Promise.all(
    files.map(async (file) => {
      const parsed = parseMigrationFilename(file)
      return {
        ...parsed,
        sql: await readFile(path.join(migrationsDir, file), "utf8"),
      }
    }),
  )

  const migrations = [...bootstrapMigrations, ...fileMigrations].sort((a, b) =>
    a.version.localeCompare(b.version),
  )

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  try {
    await client.query(`
      create table if not exists public.schema_migrations (
        version text primary key,
        name text not null,
        applied_at timestamptz not null default timezone('utc', now())
      );
    `)

    const appliedResult = await client.query(
      "select version from public.schema_migrations order by version asc",
    )
    const applied = new Set(appliedResult.rows.map((row) => row.version))

    for (const migration of migrations) {
      if (applied.has(migration.version)) {
        continue
      }

      process.stdout.write(
        `Applying migration ${migration.version}_${migration.name}...\n`,
      )

      await client.query("begin")

      try {
        await client.query(migration.sql)
        await client.query(
          "insert into public.schema_migrations (version, name) values ($1, $2)",
          [migration.version, migration.name],
        )
        await client.query("commit")
      } catch (error) {
        await client.query("rollback")
        throw error
      }
    }

    process.stdout.write("Database migrations are up to date.\n")
  } finally {
    await client.end()
  }
}

if (process.argv[2] === "--new") {
  await createNewMigration()
} else {
  await runMigrations()
}
