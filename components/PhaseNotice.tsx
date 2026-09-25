export function PhaseNotice({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
      <div className="card p-6 text-center">
        <p className="text-neutral-600">
          この機能は現在開発中です（{phase}で実装予定）。
        </p>
        <p className="text-sm text-neutral-400 mt-2">
          ナビゲーションと権限チェックは既に有効です。
        </p>
      </div>
    </div>
  )
}
