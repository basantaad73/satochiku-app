import type { LucideIcon } from 'lucide-react'
import {
  Home,
  MessageCircle,
  Megaphone,
  Users,
  NotebookPen,
  Folder,
  User,
  Settings,
} from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  /** Shown in the compact mobile bottom bar (keep this list short). */
  mobile: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'ホーム', icon: Home, mobile: true },
  { href: '/chat', label: 'チャット', icon: MessageCircle, mobile: true },
  { href: '/announcements', label: 'お知らせ', icon: Megaphone, mobile: true },
  { href: '/groups', label: 'グループ', icon: Users, mobile: false },
  { href: '/notes', label: 'ノート', icon: NotebookPen, mobile: true },
  { href: '/files', label: 'ファイル', icon: Folder, mobile: false },
  { href: '/members', label: 'メンバー', icon: User, mobile: false },
  { href: '/settings', label: '設定', icon: Settings, mobile: false },
]
