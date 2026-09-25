import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Defense in depth: middleware already blocks this, RLS blocks the data
  // regardless, and this is a third, redundant check at the page layer.
  if (profile?.role !== 'admin') redirect('/')

  return (
    <div className="min-h-dvh bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-sm text-brand-600 hover:underline">
          ← アプリに戻る
        </Link>
        <span className="text-neutral-300">|</span>
        <span className="font-semibold text-neutral-900">管理者パネル</span>
      </header>
      <main
        className="mx-auto max-w-3xl px-4 py-6"
        style={{ paddingBottom: 'calc(2rem + var(--safe-bottom))' }}
      >
        {children}
      </main>
    </div>
  )
}
