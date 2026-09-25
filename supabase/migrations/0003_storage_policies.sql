-- =========================================================================
-- 0003_storage_policies.sql
-- Private storage buckets. Nothing is public by default (section 37).
-- Files are served via short-lived signed URLs generated server-side
-- after the app verifies the requester has access to the owning
-- message/announcement/note (see lib/storage.ts).
-- =========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 5242880, array['image/png','image/jpeg','image/webp']),
  ('chat-media', 'chat-media', false, 209715200, array[
    'image/png','image/jpeg','image/webp','image/gif',
    'video/mp4','video/quicktime','video/webm'
  ]),
  ('company-files', 'company-files', false, 52428800, array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.ms-excel',
    'text/plain',
    'application/zip',
    'image/png','image/jpeg','image/webp'
  ])
on conflict (id) do nothing;

-- Avatars: user can manage their own avatar folder (path prefix = user id);
-- any active employee can view avatars (needed for the directory/UI).
create policy "avatars: owner can upload/update/delete"
  on storage.objects for all
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: active users can view"
  on storage.objects for select
  using (bucket_id = 'avatars' and public.is_active_user());

-- Chat media / company files: uploader (folder-prefixed by their user id)
-- can write. Read access is intentionally NOT granted broadly here —
-- the app never lets the browser hit these buckets directly for reads;
-- it issues short-lived signed URLs from a server route that checks
-- conversation/group/announcement membership against public.files /
-- public.messages / public.conversation_members first.
create policy "chat-media: uploader can upload"
  on storage.objects for insert
  with check (bucket_id = 'chat-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "chat-media: uploader/admin can delete"
  on storage.objects for delete
  using (
    bucket_id = 'chat-media'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "company-files: uploader can upload"
  on storage.objects for insert
  with check (bucket_id = 'company-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "company-files: uploader/admin can delete"
  on storage.objects for delete
  using (
    bucket_id = 'company-files'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- No blanket SELECT policy for chat-media/company-files: reads always
-- go through the server (service role) after an authorization check.
-- This is stricter than "everyone in the bucket can read" and matches
-- section 37's "only via conversation/group/announcement/admin" rule.
