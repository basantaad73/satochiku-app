import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Supabase client for use in Client Components.
 * Uses the anon key only — RLS policies in the database are what
 * actually restrict what this client can read/write. Never put the
 * service role key in any file under lib/supabase/client.ts.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
