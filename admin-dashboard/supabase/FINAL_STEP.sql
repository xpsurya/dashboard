-- ================================================================
-- FINAL STEP — jalankan SEKALI di Supabase SQL Editor → Run
-- Isi: (1) role admin untuk xp.surya@gmail.com
--      (2) Storage bucket "field-photos" untuk foto absen & nota
-- ================================================================

-- 1) ROLE ADMIN (wajib — tanpa ini tidak ada yang bisa menulis data master)
insert into public.user_roles (user_id, role, display_name)
select id, 'admin', 'Owner Admin' from auth.users where lower(email) = 'xp.surya@gmail.com'
on conflict (user_id) do update set role = excluded.role;

-- 2) STORAGE BUCKET untuk foto lapangan (public read; insert terbuka untuk aplikasi SPG)
insert into storage.buckets (id, name, public)
values ('field-photos', 'field-photos', true)
on conflict (id) do nothing;

drop policy if exists "field_photos_public_read" on storage.objects;
drop policy if exists "field_photos_insert" on storage.objects;
drop policy if exists "field_photos_admin_manage" on storage.objects;

create policy "field_photos_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'field-photos');

create policy "field_photos_insert" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'field-photos');

create policy "field_photos_admin_manage" on storage.objects
  for all to authenticated
  using (bucket_id = 'field-photos' and public.is_admin())
  with check (bucket_id = 'field-photos' and public.is_admin());

-- URL foto yang disimpan aplikasi SPG ke kolom photo_*_url / receipt_photo_url:
-- https://oykonaecttzabnxfcchc.supabase.co/storage/v1/object/public/field-photos/<nama-file>
