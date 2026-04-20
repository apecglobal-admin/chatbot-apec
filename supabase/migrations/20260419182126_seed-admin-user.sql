-- Seed initial Admin User
-- Username: admin
-- Password: admin123
insert into public.users (username, password_hash, display_name)
values (
    'admin', 
    '$2b$10$2Lt9kXkBDWeTtPxcr8VaD.xpIHk2Z/i9m2PeeQu/BcrrRUA2wzFPK', 
    'System Administrator'
)
on conflict (username) do update 
set password_hash = excluded.password_hash;

-- Link Admin user to Admin role
insert into public.user_roles (user_id, role_id)
select u.id, r.id
from public.users u, public.roles r
where u.username = 'admin' and r.name = 'Admin'
on conflict do nothing;
