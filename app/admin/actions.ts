'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createUserSchema, roleChangeSchema } from '@/lib/validation'

/**
 * Every admin action re-verifies the caller is an active admin using the
 * anon-key client (which is bound by RLS) BEFORE touching the service-role
 * client. This is the server-side enforcement required by section 3/20 —
 * the frontend hiding a button is never sufficient on its own.
 */
async function assertIsAdmin() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('認証されていません。')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin' || profile.status !== 'active') {
    throw new Error('この操作には管理者権限が必要です。')
  }

  return user
}

async function writeAudit(
  actorId: string,
  action: string,
  targetTable: string,
  targetId: string,
  detail?: Record<string, unknown>
) {
  const admin = createAdminClient()
  await admin.from('audit_log').insert({
    actor_id: actorId,
    action,
    target_table: targetTable,
    target_id: targetId,
    detail: detail ?? null,
  })
}

export type FormState = { error?: string; success?: string } | null

export async function createUser(_prev: FormState, formData: FormData): Promise<FormState> {
  let actor
  try {
    actor = await assertIsAdmin()
  } catch (e) {
    return { error: (e as Error).message }
  }

  const parsed = createUserSchema.safeParse({
    email: formData.get('email'),
    name: formData.get('name'),
    display_name: formData.get('display_name'),
    department: formData.get('department') || undefined,
    role: formData.get('role'),
  })

  if (!parsed.success) {
    return { error: '入力内容を確認してください。' }
  }

  const admin = createAdminClient()

  // Create the auth user with a random temp password; Supabase sends an
  // invite email so the employee sets their own password on first login.
  // No credentials are ever hard-coded (section 38).
  const { data: created, error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: {
      name: parsed.data.name,
      display_name: parsed.data.display_name,
      role: parsed.data.role,
    },
  })

  if (error || !created?.user) {
    return { error: 'ユーザーの作成に失敗しました。メールアドレスを確認してください。' }
  }

  if (parsed.data.department) {
    await admin
      .from('profiles')
      .update({ department: parsed.data.department })
      .eq('id', created.user.id)
  }

  await writeAudit(actor.id, 'user.created', 'profiles', created.user.id, {
    role: parsed.data.role,
  })

  revalidatePath('/admin/users')
  return { success: `${parsed.data.display_name} さんを招待しました。` }
}

const roleChangeSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['admin', 'manager', 'employee']),
})

export async function changeUserRole(formData: FormData): Promise<void> {
  const actor = await assertIsAdmin()
  const parsed = roleChangeSchema.parse({
    userId: formData.get('userId'),
    role: formData.get('role'),
  })

  // Prevent an admin from locking themselves out entirely by accident
  // by demoting the very last admin account.
  const admin = createAdminClient()
  if (parsed.userId === actor.id && parsed.role !== 'admin') {
    const { count } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
    if ((count ?? 0) <= 1) {
      throw new Error('最後の管理者の権限は変更できません。')
    }
  }

  await admin.from('profiles').update({ role: parsed.role }).eq('id', parsed.userId)
  await writeAudit(actor.id, 'role.changed', 'profiles', parsed.userId, { role: parsed.role })
  revalidatePath('/admin/users')
}

export async function setUserStatus(formData: FormData): Promise<void> {
  const actor = await assertIsAdmin()
  const userId = formData.get('userId') as string
  const status = formData.get('status') as 'active' | 'disabled'

  if (userId === actor.id && status === 'disabled') {
    throw new Error('自分自身のアカウントを無効化することはできません。')
  }

  const admin = createAdminClient()
  await admin.from('profiles').update({ status }).eq('id', userId)
  await writeAudit(actor.id, status === 'disabled' ? 'user.disabled' : 'user.enabled', 'profiles', userId)
  revalidatePath('/admin/users')
}

/**
 * Deletes one file: removes the bytes from Storage, then the metadata
 * row. Any message/announcement that referenced it keeps its row (the
 * FK is ON DELETE SET NULL) and the UI shows "このファイルは削除されました"
 * instead of silently breaking — see MessageFile rendering in Phase 2/3.
 */
export async function deleteFile(formData: FormData): Promise<void> {
  const actor = await assertIsAdmin()
  const fileId = formData.get('fileId') as string

  const admin = createAdminClient()
  const { data: file } = await admin
    .from('files')
    .select('bucket_id, storage_path, thumbnail_path, filename, size_bytes')
    .eq('id', fileId)
    .single()

  if (!file) return

  const pathsToRemove = [file.storage_path, file.thumbnail_path].filter(Boolean) as string[]
  await admin.storage.from(file.bucket_id).remove(pathsToRemove)
  await admin.from('files').delete().eq('id', fileId)

  await writeAudit(actor.id, 'file.deleted', 'files', fileId, {
    filename: file.filename,
    size_bytes: file.size_bytes,
  })

  revalidatePath('/admin/storage')
}

/**
 * Bulk cleanup: deletes every file older than N days that is NOT marked
 * is_original_retained (section 10's "keep originals of important
 * company photos" opt-out). Lets an admin reclaim space in one click
 * instead of deleting files one by one.
 */
export async function deleteFilesOlderThan(formData: FormData): Promise<void> {
  const actor = await assertIsAdmin()
  const days = Number(formData.get('days'))
  if (!Number.isFinite(days) || days < 1) throw new Error('無効な日数です。')

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const admin = createAdminClient()

  const { data: oldFiles } = await admin
    .from('files')
    .select('id, bucket_id, storage_path, thumbnail_path, size_bytes')
    .lt('created_at', cutoff)
    .eq('is_original_retained', false)

  if (!oldFiles || oldFiles.length === 0) return

  // Group by bucket since storage.remove() is per-bucket.
  const byBucket = new Map<string, string[]>()
  for (const f of oldFiles) {
    const paths = [f.storage_path, f.thumbnail_path].filter(Boolean) as string[]
    byBucket.set(f.bucket_id, [...(byBucket.get(f.bucket_id) ?? []), ...paths])
  }
  for (const [bucket, paths] of byBucket) {
    await admin.storage.from(bucket).remove(paths)
  }

  const totalBytes = oldFiles.reduce((sum, f) => sum + Number(f.size_bytes), 0)
  await admin.from('files').delete().in('id', oldFiles.map((f) => f.id))

  await writeAudit(actor.id, 'files.bulk_deleted', 'files', `${oldFiles.length} files`, {
    days_threshold: days,
    freed_bytes: totalBytes,
  })

  revalidatePath('/admin/storage')
}
