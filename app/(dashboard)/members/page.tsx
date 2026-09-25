import { createClient } from '@/lib/supabase/server'

const ROLE_LABEL: Record<string, string> = {
  admin: '管理者',
  manager: 'マネージャー',
  employee: '社員',
}

export default async function MembersPage() {
  const supabase = createClient()

  // Reads the `directory` view (section 21/17): active users only,
  // no email or other sensitive fields exposed.
  const { data: members, error } = await supabase
    .from('directory')
    .select('id, name, department, role, avatar_url')
    .order('name')

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-neutral-900">メンバー</h1>

      {error && (
        <p className="text-sm text-red-600">
          通信エラーが発生しました。インターネット接続を確認して、もう一度お試しください。
        </p>
      )}

      <div className="space-y-2">
        {members?.map((member) => (
          <div key={member.id} className="card p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold shrink-0 overflow-hidden">
              {member.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                member.name?.[0] ?? '?'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-neutral-900 truncate">{member.name}</p>
              <p className="text-sm text-neutral-500 truncate">
                {member.department ?? '部署未設定'} ・ {ROLE_LABEL[member.role ?? 'employee']}
              </p>
            </div>
          </div>
        ))}

        {members?.length === 0 && (
          <p className="text-sm text-neutral-500 text-center py-8">メンバーがいません。</p>
        )}
      </div>
    </div>
  )
}
