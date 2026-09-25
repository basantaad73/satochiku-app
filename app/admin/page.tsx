import Link from 'next/link'
import { APP_VERSION, COMPANY_NAME } from '@/lib/config'

const SECTIONS = [
  { href: '/admin/users', label: 'ユーザー管理', icon: '👤', ready: true },
  { href: '/admin/groups', label: 'グループ管理', icon: '👥', ready: false },
  { href: '/admin/announcements', label: 'お知らせ管理', icon: '📢', ready: false },
  { href: '/admin/storage', label: 'ストレージ', icon: '💾', ready: true },
  { href: '/admin/system', label: 'システム情報', icon: '⚙️', ready: false },
]

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">{COMPANY_NAME}</h1>
        <p className="text-sm text-neutral-500">Version {APP_VERSION}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {SECTIONS.map((s) =>
          s.ready ? (
            <Link key={s.href} href={s.href} className="card p-4 flex items-center gap-3 hover:border-brand-300">
              <span className="text-xl">{s.icon}</span>
              <span className="font-medium text-neutral-800">{s.label}</span>
            </Link>
          ) : (
            <div key={s.href} className="card p-4 flex items-center gap-3 opacity-50">
              <span className="text-xl">{s.icon}</span>
              <div>
                <p className="font-medium text-neutral-800">{s.label}</p>
                <p className="text-xs text-neutral-400">今後のフェーズで実装</p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
