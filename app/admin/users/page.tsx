import { createAdminClient, createClient } from '@/lib/supabase/server'
import { changeUserRole, setUserStatus } from '../actions'
import { InviteUserForm } from './InviteUserForm'

const ROLE_LABEL: Record<string, string> = {
  admin: '管理者',
  manager: 'マネージャー',
  employee: '社員',
}

export default async function AdminUsersPage() {
  const supabase = createClient()
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  // Service-role read here is fine: this page is already gated by the
  // admin-only layout, and we want to see disabled users too (which the
  // 'directory' view intentionally excludes).
  const admin = createAdminClient()
  const { data: users } = await admin
    .from('profiles')
    .select('id, name, display_name, department, role, status, created_at, last_login_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-neutral-900">ユーザー管理</h1>

      <div className="card p-4">
        <h2 className="font-semibold text-neutral-900 mb-3">新しいユーザーを招待</h2>
        <InviteUserForm />
      </div>

      <div className="space-y-2">
        {users?.map((u) => (
          <div key={u.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-neutral-900 truncate">
                {u.display_name}
                {u.status === 'disabled' && (
                  <span className="ml-2 text-xs text-red-600 font-normal">（無効）</span>
                )}
              </p>
              <p className="text-sm text-neutral-500 truncate">
                {u.department ?? '部署未設定'} ・ 最終ログイン:{' '}
                {u.last_login_at ? new Date(u.last_login_at).toLocaleString('ja-JP') : '未ログイン'}
              </p>
            </div>

            <form action={changeUserRole} className="flex items-center gap-2">
              <input type="hidden" name="userId" value={u.id} />
              <select name="role" defaultValue={u.role} className="input-field !py-2 text-sm">
                {Object.entries(ROLE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-secondary text-sm !py-2">
                変更
              </button>
            </form>

            <form action={setUserStatus}>
              <input type="hidden" name="userId" value={u.id} />
              <input type="hidden" name="status" value={u.status === 'active' ? 'disabled' : 'active'} />
              <button
                type="submit"
                className={`text-sm !py-2 ${u.status === 'active' ? 'btn-secondary' : 'btn-primary'}`}
                disabled={u.id === currentUser?.id && u.status === 'active'}
              >
                {u.status === 'active' ? '無効化' : '有効化'}
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}
