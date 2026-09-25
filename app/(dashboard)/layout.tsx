import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/nav/Sidebar'
import { BottomNav } from '@/components/nav/BottomNav'
import { COMPANY_NAME } from '@/lib/config'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role, status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status === 'disabled') {
    redirect('/login')
  }

  return (
    <div className="min-h-dvh bg-neutral-50">
      <Sidebar
        companyName={COMPANY_NAME}
        displayName={profile.display_name}
        isAdmin={profile.role === 'admin'}
      />

      <div className="md:pl-64">
        <main
          className="mx-auto max-w-3xl px-4 pb-24 md:pb-8"
          style={{ paddingTop: 'calc(1.5rem + var(--safe-top))' }}
        >
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
