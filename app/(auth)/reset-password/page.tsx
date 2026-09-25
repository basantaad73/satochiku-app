'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { requestPasswordReset } from '../actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? '送信中...' : '再設定メールを送信'}
    </button>
  )
}

export default function ResetPasswordPage() {
  const [state, formAction] = useFormState(requestPasswordReset, null)

  return (
    <main className="min-h-dvh flex items-center justify-center bg-brand-50 px-4 py-[calc(2rem+var(--safe-top))]">
      <div className="w-full max-w-sm">
        <h1 className="text-lg font-bold text-neutral-900 text-center mb-6">
          パスワードの再設定
        </h1>

        <form action={formAction} className="card p-6 space-y-4">
          <input
            name="email"
            type="email"
            required
            placeholder="メールアドレス"
            className="input-field"
          />

          {state?.error && (
            <p role="alert" className="text-sm text-red-600">
              {state.error}
            </p>
          )}

          <SubmitButton />

          <p className="text-xs text-neutral-500 text-center">
            登録されているメールアドレスに再設定用のリンクをお送りします。
          </p>

          <a href="/login" className="block text-center text-sm text-brand-600 hover:underline">
            ログイン画面に戻る
          </a>
        </form>
      </div>
    </main>
  )
}
