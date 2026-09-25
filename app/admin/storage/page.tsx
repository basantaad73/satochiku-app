import { createAdminClient } from '@/lib/supabase/server'
import { deleteFile, deleteFilesOlderThan } from '../actions'
import { formatBytes } from '@/lib/format-bytes'
import { STORAGE_PLAN_LIMIT_BYTES, STORAGE_WARNING_THRESHOLD } from '@/lib/config'

export default async function AdminStoragePage() {
  const admin = createAdminClient()

  const { data: files } = await admin
    .from('files')
    .select('id, filename, mime_type, bucket_id, size_bytes, uploader_id, created_at, is_original_retained')
    .order('size_bytes', { ascending: false })

  const all = files ?? []
  const totalBytes = all.reduce((sum, f) => sum + Number(f.size_bytes), 0)
  const usedRatio = totalBytes / STORAGE_PLAN_LIMIT_BYTES
  const isWarning = usedRatio >= STORAGE_WARNING_THRESHOLD
  const isFull = usedRatio >= 1

  const byBucket = all.reduce<Record<string, number>>((acc, f) => {
    acc[f.bucket_id] = (acc[f.bucket_id] ?? 0) + Number(f.size_bytes)
    return acc
  }, {})

  const largest = all.slice(0, 25)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-neutral-900">ストレージ管理</h1>

      {/* Usage summary */}
      <div className="card p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">
            使用中: {formatBytes(totalBytes)} / {formatBytes(STORAGE_PLAN_LIMIT_BYTES)}
          </span>
          <span className={isFull ? 'text-red-600 font-medium' : isWarning ? 'text-amber-600 font-medium' : 'text-neutral-500'}>
            {(usedRatio * 100).toFixed(1)}%
          </span>
        </div>
        <div className="h-3 rounded-full bg-neutral-100 overflow-hidden">
          <div
            className={`h-full rounded-full ${isFull ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-brand-500'}`}
            style={{ width: `${Math.min(usedRatio * 100, 100)}%` }}
          />
        </div>

        {isFull && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            容量の上限に達しました。新しい写真・動画・ファイルを送信する前に、下から不要なファイルを削除してください。
          </p>
        )}
        {!isFull && isWarning && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            容量が残り少なくなっています。古いファイルの整理をおすすめします。
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 pt-2 text-sm">
          <div>
            <p className="text-neutral-500">写真・動画</p>
            <p className="font-medium">{formatBytes(byBucket['chat-media'] ?? 0)}</p>
          </div>
          <div>
            <p className="text-neutral-500">ファイル</p>
            <p className="font-medium">{formatBytes(byBucket['company-files'] ?? 0)}</p>
          </div>
          <div>
            <p className="text-neutral-500">アバター</p>
            <p className="font-medium">{formatBytes(byBucket['avatars'] ?? 0)}</p>
          </div>
        </div>
      </div>

      {/* Bulk cleanup */}
      <div className="card p-4">
        <h2 className="font-semibold text-neutral-900 mb-2">古いファイルを一括削除</h2>
        <p className="text-sm text-neutral-500 mb-3">
          「重要な写真として保存」に指定されていないファイルのみが対象です（写真アップロード時に選択可能）。
          この操作は取り消せません。
        </p>
        <form action={deleteFilesOlderThan} className="flex flex-wrap items-center gap-2">
          <select name="days" defaultValue="90" className="input-field !py-2 text-sm w-auto">
            <option value="30">30日以前</option>
            <option value="90">90日以前</option>
            <option value="180">180日以前</option>
            <option value="365">1年以前</option>
          </select>
          <button type="submit" className="btn-secondary text-sm !py-2">
            削除を実行
          </button>
        </form>
      </div>

      {/* Largest files, individually deletable */}
      <div className="card p-4">
        <h2 className="font-semibold text-neutral-900 mb-3">容量の大きいファイル（上位25件）</h2>
        <div className="space-y-2">
          {largest.map((f) => (
            <div key={f.id} className="flex items-center gap-3 py-2 border-b border-neutral-50 last:border-0">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-800 truncate">
                  {f.filename}
                  {f.is_original_retained && (
                    <span className="ml-2 text-xs text-brand-600 font-normal">保存対象</span>
                  )}
                </p>
                <p className="text-xs text-neutral-400">
                  {formatBytes(Number(f.size_bytes))} ・{' '}
                  {new Date(f.created_at).toLocaleDateString('ja-JP')}
                </p>
              </div>
              <form action={deleteFile}>
                <input type="hidden" name="fileId" value={f.id} />
                <button type="submit" className="text-sm text-red-600 hover:underline shrink-0 !min-h-0 py-1">
                  削除
                </button>
              </form>
            </div>
          ))}

          {largest.length === 0 && (
            <p className="text-sm text-neutral-500 text-center py-6">
              まだファイルがアップロードされていません。
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
