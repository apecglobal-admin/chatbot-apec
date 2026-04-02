-- Create store_settings table
CREATE TABLE IF NOT EXISTS store_settings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  support_phone TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  zone_label TEXT NOT NULL,
  description TEXT NOT NULL,
  welcome_message TEXT NOT NULL,
  placeholder TEXT NOT NULL,
  suggested_prompts JSONB NOT NULL,
  theme JSONB NOT NULL,
  assistant_slug TEXT NOT NULL,
  api_endpoint TEXT NOT NULL,
  api_key TEXT,
  partner_user_prefix TEXT NOT NULL,
  request_timeout_ms INTEGER NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default store settings
INSERT INTO store_settings (id, name, subtitle, support_phone, updated_at)
VALUES (
  'default',
  'Apec Shelf AI',
  'Mỗi màn hình tại kệ là một trợ lý sản phẩm chuyên biệt.',
  '1900 6868',
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  subtitle = EXCLUDED.subtitle,
  support_phone = EXCLUDED.support_phone,
  updated_at = now();

-- Insert default departments
INSERT INTO departments (
  id, name, slug, zone_label, description, welcome_message, placeholder,
  suggested_prompts, theme, assistant_slug, api_endpoint, api_key,
  partner_user_prefix, request_timeout_ms, display_order, is_active, updated_at
) VALUES
(
  'fresh-food',
  'Thực phẩm tươi',
  'thuc-pham-tuoi',
  'Kệ A1',
  'Rau củ, trái cây, thịt cá và gợi ý bảo quản tại quầy tươi.',
  'Xin chào, tôi phụ trách quầy Thực phẩm tươi. Bạn cần tìm sản phẩm, hỏi cách chọn hay bảo quản nguyên liệu nào?',
  'Ví dụ: Cá hồi hôm nay còn không? Bảo quản thịt bò thế nào?',
  '["Cá hồi hôm nay còn không?", "Rau nào hợp để nấu canh chua?", "Bảo quản thịt bò trong ngăn mát bao lâu?"]'::jsonb,
  '{"accent":"#2F855A","accentSoft":"#D7F5E4","panel":"#F4FAF6","surface":"#FFFFFF","userBubble":"#2F855A","assistantBubble":"#E8F4EC","badge":"#163E2D"}'::jsonb,
  'space',
  'https://rag-ai-jn9g.onrender.com/api/external/chat-stream',
  '',
  'apec-shelf',
  20000,
  1,
  true,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  zone_label = EXCLUDED.zone_label,
  description = EXCLUDED.description,
  welcome_message = EXCLUDED.welcome_message,
  placeholder = EXCLUDED.placeholder,
  suggested_prompts = EXCLUDED.suggested_prompts,
  theme = EXCLUDED.theme,
  assistant_slug = EXCLUDED.assistant_slug,
  api_endpoint = EXCLUDED.api_endpoint,
  api_key = EXCLUDED.api_key,
  partner_user_prefix = EXCLUDED.partner_user_prefix,
  request_timeout_ms = EXCLUDED.request_timeout_ms,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();
