-- MSM Fleet Control — skema Supabase. Jalankan SEKALI di SQL Editor.
create table profiles (id uuid primary key references auth.users on delete cascade, name text, role text not null check (role in ('super_admin','admin_area','user','management')), area int);
create table units (id text primary key, area int, data jsonb not null);
create table drivers (id text primary key, area int, data jsonb not null);
create table attendance (id text primary key, area int, data jsonb not null);
create table schedules (id text primary key, area int, data jsonb not null);
create table history (id text primary key, area int, data jsonb not null);
create table settings (id text primary key, data jsonb not null);
create table requests (id text primary key, area int, owner uuid default auth.uid(), data jsonb not null);

create function public.my_role() returns text language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() $$;

alter table profiles enable row level security;
create policy "profil sendiri" on profiles for select to authenticated using (id = auth.uid());

do $$ declare t text; begin
  foreach t in array array['units','attendance','history','drivers','schedules','settings'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "baca staf" on %I for select to authenticated using (public.my_role() in (''super_admin'',''admin_area'',''management''))', t);
  end loop;
  -- admin area boleh mengubah status unit, absensi, dan riwayat
  foreach t in array array['units','attendance','history'] loop
    execute format('create policy "tulis admin" on %I for all to authenticated using (public.my_role() in (''super_admin'',''admin_area'')) with check (public.my_role() in (''super_admin'',''admin_area''))', t);
  end loop;
  -- hanya fleet super admin yang mengubah driver, jadwal, dan pengaturan
  foreach t in array array['drivers','schedules','settings'] loop
    execute format('create policy "tulis super admin" on %I for all to authenticated using (public.my_role() = ''super_admin'') with check (public.my_role() = ''super_admin'')', t);
  end loop;
end $$;

alter table requests enable row level security;
create policy "baca staf" on requests for select to authenticated using (public.my_role() in ('super_admin','admin_area','management'));
create policy "baca milik sendiri" on requests for select to authenticated using (owner = auth.uid());
create policy "buat milik sendiri" on requests for insert to authenticated with check (owner = auth.uid());
create policy "kelola super admin" on requests for all to authenticated using (public.my_role() = 'super_admin') with check (public.my_role() = 'super_admin');

alter publication supabase_realtime add table units, drivers, attendance, requests, schedules, history, settings;

-- LANGKAH SETELAH membuat akun di Authentication > Users: beri peran (ganti email, nama, peran).
-- Peran: super_admin | admin_area | user | management. Kolom area hanya diisi (1/2/3) untuk admin_area.
-- insert into profiles (id, name, role, area) select id, 'Nama Anda', 'super_admin', null from auth.users where email = 'email@anda.com';
