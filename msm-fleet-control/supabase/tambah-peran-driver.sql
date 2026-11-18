-- Jalankan SEKALI di SQL Editor: menambahkan peran 'driver' pada tabel profiles.
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('super_admin','admin_area','user','management','driver'));

-- Beri peran per akun (username dibuat di Authentication sebagai username@msmfleet.com):
-- insert into profiles (id, name, role, area) select id, 'Nama Lengkap', 'super_admin', null from auth.users where email = 'username@msmfleet.com';  -- Fleet Analyst
-- insert into profiles (id, name, role, area) select id, 'Nama Lengkap', 'user',        null from auth.users where email = 'username@msmfleet.com';  -- User / Pemohon
-- insert into profiles (id, name, role, area) select id, 'Nama Lengkap', 'driver',      1    from auth.users where email = 'username@msmfleet.com';  -- Driver (area 1/2/3)
