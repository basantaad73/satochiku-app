import Link from 'next/link'
import { Building2, ShieldCheck } from 'lucide-react'
import { NAV_ITEMS } from '@/lib/nav-items'
import { logout } from '@/app/(auth)/actions'

export function Sidebar({
  companyName,
  displayName,
  isAdmin,
}: {
  companyName: string
  displayName: string
  isAdmin: boolean
}) {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-neutral-200 bg-white">
      <div className="px-5 py-6 border-b border-neutral-100">
        <p className="text-lg font-bold text-neutral-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-brand-600" aria-hidden />
          {companyName}
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-neutral-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
          >
            <item.icon className="w-5 h-5" aria-hidden />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}

        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-neutral-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
          >
            <ShieldCheck className="w-5 h-5" aria-hidden />
            <span className="font-medium">管理者パネル</span>
          </Link>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-neutral-100">
        <p className="px-3 text-sm text-neutral-500 truncate mb-2">{displayName} さん</p>
        <form action={logout}>
          <button type="submit" className="btn-secondary w-full text-sm">
            ログアウト
          </button>
        </form>
      </div>
    </aside>
  )
}
