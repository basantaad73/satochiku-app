import Link from 'next/link'
import { NAV_ITEMS } from '@/lib/nav-items'

export function BottomNav() {
  const items = NAV_ITEMS.filter((item) => item.mobile)

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 z-40"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <ul className="flex items-stretch justify-around">
        {items.map((item) => (
          <li key={item.href} className="flex-1">
            <Link
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-neutral-600 active:bg-neutral-50"
            >
              <item.icon className="w-5 h-5" aria-hidden />
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
