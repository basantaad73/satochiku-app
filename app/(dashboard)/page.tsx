import Link from 'next/link'
import { MessageCircle, Megaphone, Users, NotebookPen, Camera, Folder } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

const QUICK_LINKS = [
  { href: '/chat', label: 'チャット', icon: MessageCircle },
  { href: '/announcements', label: 'お知らせ', icon: Megaphone },
  { href: '/groups', label: 'グループ', icon: Users },
  { href: '/notes', label: 'ノート', icon: NotebookPen },
  { href: '/files', label: '写真・動画', icon: Camera },
  { href: '/files', label: 'ファイル', icon: Folder },
]

function greeting(hour: number) {
  if (hour < 11) return 'おはようございます'
  if (hour < 17) return 'こんにちは'
  return 'お疲れ様です'
}

export default async function DashboardHome() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user!.id)
    .single()

  const hour = new Date().getHours()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">
          {greeting(hour)}、{profile?.display_name ?? ''}さん
        </h1>
      </div>

      <section>
        <div className="grid grid-cols-3 gap-3">
          {QUICK_LINKS.map((link, i) => (
            <Link
              key={`${link.href}-${i}`}
              href={link.href}
              className="card flex flex-col items-center justify-center gap-2 py-5 hover:border-brand-300 hover:shadow-md transition-shadow"
            >
              <span className="text-brand-600" aria-hidden>
                <link.icon className="w-6 h-6" />
              </span>
              <span className="text-sm font-medium text-neutral-700">{link.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="font-semibold text-neutral-900 mb-3">最近の活動</h2>
        <ActivityPlaceholder />
      </section>
    </div>
  )
}

function ActivityPlaceholder() {
  // Real activity feed (from messages/announcements/files) ships in Phase 4
  // once those tables have live data. Kept visually honest — no fake entries.
  return (
    <p className="text-sm text-neutral-500 py-4 text-center">
      まだ活動はありません。チャットやお知らせを利用すると、ここに表示されます。
    </p>
  )
}
