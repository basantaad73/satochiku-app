/**
 * Hand-written types matching supabase/migrations/*.sql, scoped to what
 * Phase 1 code actually queries. Once the project is linked to a real
 * Supabase instance, replace this file by running:
 *
 *   npm run db:types
 *
 * (requires SUPABASE_PROJECT_ID env var and the Supabase CLI logged in)
 * which generates complete, exact types for every table/view/function.
 */
export type UserRole = 'admin' | 'manager' | 'employee'
export type UserStatus = 'active' | 'disabled'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          display_name: string
          department: string | null
          role: UserRole
          status: UserStatus
          avatar_url: string | null
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      audit_log: {
        Row: {
          id: string
          actor_id: string | null
          action: string
          target_table: string | null
          target_id: string | null
          detail: Record<string, unknown> | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['audit_log']['Row']>
        Update: Partial<Database['public']['Tables']['audit_log']['Row']>
      }
    }
    Views: {
      directory: {
        Row: {
          id: string
          name: string
          display_name: string
          department: string | null
          role: UserRole
          avatar_url: string | null
          status: UserStatus
        }
      }
    }
  }
}
