-- 1. Create permissions table
create table if not exists public.permissions (
    id uuid primary key default gen_random_uuid(),
    key text not null unique,
    name text not null,
    description text,
    created_at timestamptz not null default timezone('utc', now())
);

-- 2. Create roles table
create table if not exists public.roles (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    created_at timestamptz not null default timezone('utc', now())
);

-- 3. Create users table (Custom Auth)
create table if not exists public.users (
    id uuid primary key default gen_random_uuid(),
    username text not null unique,
    password_hash text not null,
    display_name text,
    is_active boolean not null default true,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

-- 4. Create join tables
create table if not exists public.role_permissions (
    role_id uuid references public.roles(id) on delete cascade,
    permission_id uuid references public.permissions(id) on delete cascade,
    primary key (role_id, permission_id)
);

create table if not exists public.user_roles (
    user_id uuid references public.users(id) on delete cascade,
    role_id uuid references public.roles(id) on delete cascade,
    primary key (user_id, role_id)
);

-- 5. Seed fixed permissions
insert into public.permissions (key, name, description)
values 
    ('cms:view', 'Xem Dashboard', 'Quyền xem các chỉ số thống kê và danh sách ngành hàng.'),
    ('cms:content', 'Quản lý Nội dung', 'Quyền chỉnh sửa thông tin cơ bản, lời chào và các câu hỏi gợi ý.'),
    ('cms:theme', 'Quản lý Giao diện', 'Quyền chỉnh sửa màu sắc, hình ảnh và cấu hình trạng thái chờ.'),
    ('cms:tech', 'Quản lý Kỹ thuật', 'Quyền chỉnh sửa API Key, Endpoint và các tham số kỹ thuật.'),
    ('cms:admin', 'Quản trị hệ thống', 'Quyền quản lý tài khoản người dùng và phân quyền.')
on conflict (key) do nothing;

-- 6. Add updated_at trigger for users
drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

-- 7. Seed initial Admin Role
insert into public.roles (name, description)
values ('Admin', 'Toàn quyền quản trị hệ thống')
on conflict (name) do nothing;

-- Link Admin role to all permissions
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id 
from public.roles r, public.permissions p
where r.name = 'Admin'
on conflict do nothing;
