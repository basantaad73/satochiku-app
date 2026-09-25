-- =========================================================================
-- 0002_full_data_model.sql
-- Lays out the full schema from the spec (section 21) so later phases
-- build on stable tables. Chat/file/notification RLS is intentionally
-- conservative here (owner + admin only) and will be extended with
-- group/conversation-membership policies in the Phase 2/3 migrations.
-- =========================================================================

create type conversation_type as enum ('direct', 'group');
create type message_type as enum ('text', 'image', 'video', 'file', 'system');
create type note_visibility as enum ('private', 'shared');
create type announcement_priority as enum ('normal', 'important');

-- ---------------------------------------------------------------------
-- CONVERSATIONS / GROUPS
-- ---------------------------------------------------------------------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  type conversation_type not null,
  group_id uuid references public.groups (id) on delete cascade, -- null for direct chats
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member', -- 'member' | 'admin' within the conversation/group
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

-- ---------------------------------------------------------------------
-- FILES (object storage metadata; binaries live in Supabase Storage)
-- ---------------------------------------------------------------------
create table public.files (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references public.profiles (id) on delete cascade,
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  bucket_id text not null default 'company-files',
  storage_path text not null unique,
  thumbnail_path text,
  is_original_retained boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_files_size_desc on public.files (size_bytes desc);

-- ---------------------------------------------------------------------
-- MESSAGES
-- ---------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  message_type message_type not null default 'text',
  body text,
  file_id uuid references public.files (id) on delete set null,
  reply_to_message_id uuid references public.messages (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_messages_conversation_created on public.messages (conversation_id, created_at desc);

-- ---------------------------------------------------------------------
-- NOTES
-- ---------------------------------------------------------------------
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  content text not null default '',
  visibility note_visibility not null default 'private',
  is_pinned boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- ANNOUNCEMENTS
-- ---------------------------------------------------------------------
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  image_file_id uuid references public.files (id) on delete set null,
  attachment_file_id uuid references public.files (id) on delete set null,
  author_id uuid not null references public.profiles (id) on delete cascade,
  priority announcement_priority not null default 'normal',
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table public.announcement_reads (
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

-- ---------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------
create type notification_type as enum ('message', 'mention', 'announcement', 'file_shared', 'system');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type notification_type not null,
  reference_id uuid,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_unread on public.notifications (user_id) where read_at is null;

-- ---------------------------------------------------------------------
-- RLS: enable on everything; conservative baseline policies.
-- Group/conversation-membership-aware policies are added in
-- 0003_messaging_rls.sql (Phase 2) once chat logic is built.
-- ---------------------------------------------------------------------
alter table public.groups enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.files enable row level security;
alter table public.messages enable row level security;
alter table public.notes enable row level security;
alter table public.announcements enable row level security;
alter table public.announcement_reads enable row level security;
alter table public.notifications enable row level security;

-- Notes: strictly owner-only, or shared-visibility readable by all active users.
create policy "notes: owner full access"
  on public.notes for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "notes: active users can read shared notes"
  on public.notes for select
  using (visibility = 'shared' and public.is_active_user());

-- Announcements: everyone active can read; only admin/manager can write.
create policy "announcements: active users can read"
  on public.announcements for select
  using (public.is_active_user());

create policy "announcements: admin/manager can manage"
  on public.announcements for all
  using (public.is_admin_or_manager())
  with check (public.is_admin_or_manager());

create policy "announcement_reads: user manages own read receipts"
  on public.announcement_reads for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Notifications: users only see their own.
create policy "notifications: owner only"
  on public.notifications for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Groups: any active user can view group metadata; admin/manager manage.
create policy "groups: active users can view"
  on public.groups for select
  using (public.is_active_user());

create policy "groups: admin/manager manage"
  on public.groups for all
  using (public.is_admin_or_manager())
  with check (public.is_admin_or_manager());

-- Conversation membership gates conversations/messages/files access.
create policy "conversation_members: member can see own memberships"
  on public.conversation_members for select
  using (user_id = auth.uid() or public.is_admin());

create policy "conversations: members can view"
  on public.conversations for select
  using (
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = id and cm.user_id = auth.uid()
    )
  );

create policy "messages: members can read"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()
    )
  );

create policy "messages: members can send"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()
    )
  );

create policy "messages: sender can edit/delete own"
  on public.messages for update
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

-- Files: only the uploader (or an admin) can manage metadata directly;
-- read access for others is granted through the referencing message/
-- announcement/group, enforced by Storage policies (see storage_policies.sql).
create policy "files: uploader and admin manage"
  on public.files for all
  using (uploader_id = auth.uid() or public.is_admin())
  with check (uploader_id = auth.uid() or public.is_admin());
