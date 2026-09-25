import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Supabase client for Server Components, Route Handlers, and Server Actions.
 * Reads/writes the auth cookie so sessions persist across requests.
 * Still uses the anon key — authorization is enforced by RLS.
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Called from a Server Component with no request context available;
            // safe to ignore because middleware refreshes the session on navigation.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // See note above.
          }
        },
      },
    }
  )
}

/**
 * Admin client using the SERVICE ROLE key. Bypasses RLS entirely.
 * ONLY import this inside server-only code (Route Handlers / Server
 * Actions) that has already verified the caller is an admin. Never
 * import this from a Client Component or anything bundled to the browser.
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() {
          return undefined
        },
        set() {},
        remove() {},
      },
    }
  )
}
