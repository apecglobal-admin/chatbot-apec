-- Migration: Change roles & permissions ID from UUID to SERIAL INT
-- ⚠️ This drops and recreates tables. Data will be re-seeded.

BEGIN;

-- 1. Drop dependent junction tables
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- 2. Recreate permissions with INT id
DROP TABLE IF EXISTS permissions CASCADE;
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Recreate roles with INT id
DROP TABLE IF EXISTS roles CASCADE;
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Recreate junction tables with INT FKs
CREATE TABLE role_permissions (
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- 5. Seed all permissions
INSERT INTO permissions (name, key) VALUES
  -- Ngành hàng
  ('Thêm ngành hàng', 'department:create'),
  ('Xóa ngành hàng', 'department:delete'),
  ('Sửa giao diện ngành hàng', 'department:theme'),
  ('Xem backend ngành hàng', 'department:backend:read'),
  ('Sửa backend ngành hàng', 'department:backend'),
  -- Nhân sự
  ('Xem nhân sự', 'staff:read'),
  ('Thêm nhân sự', 'staff:create'),
  ('Sửa nhân sự', 'staff:update'),
  ('Xóa nhân sự', 'staff:delete'),
  -- Phân quyền
  ('Phân quyền', 'roles:manage');

-- 6. Enable RLS (match existing Supabase setup)
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access
CREATE POLICY "service_role_all" ON permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON role_permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON user_roles FOR ALL USING (true) WITH CHECK (true);

COMMIT;
