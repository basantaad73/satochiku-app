/**
 * Centralized app configuration. Per spec section 2 and 47, the company
 * name and version must be easy to change without touching UI code.
 *
 * For Phase 1 this is a constant. In Phase 5 (Admin Panel) this moves
 * into a `public.app_settings` table (single row, admin-editable) so it
 * can be changed at runtime without a redeploy — this constant becomes
 * the fallback default if that row hasn't been set yet.
 */
export const COMPANY_NAME = '佐藤畜産食品株式会社'
export const APP_VERSION = '0.1'

/**
 * Supabase free-tier storage cap, in bytes. Used only to render a
 * usage bar / warnings in the admin Storage panel — staying under this
 * by periodically deleting old photos/videos is a supported, permanent
 * way to run the app at $0/month; it is not a "trial" limit.
 * Update this if the project is ever moved to a paid plan.
 */
export const STORAGE_PLAN_LIMIT_BYTES = 1 * 1024 * 1024 * 1024 // 1 GB
export const STORAGE_WARNING_THRESHOLD = 0.8 // warn admins at 80% full
