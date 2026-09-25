import { APP_VERSION, COMPANY_NAME } from '@/lib/config'

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-neutral-900">設定</h1>
      <div className="card p-4 space-y-2 text-sm">
        <p className="text-neutral-500">会社名</p>
        <p className="font-medium text-neutral-900">{COMPANY_NAME}</p>
      </div>
      <div className="card p-4 space-y-2 text-sm">
        <p className="text-neutral-500">アプリバージョン</p>
        <p className="font-medium text-neutral-900">Version {APP_VERSION}</p>
      </div>
    </div>
  )
}
