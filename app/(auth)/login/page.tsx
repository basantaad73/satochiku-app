'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { Building2 } from 'lucide-react'
import { login } from '../actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? 'ログイン中...' : 'ログイン'}
    </button>
  )
}

export default function LoginPage() {
  const [state, formAction] = useFormState(login, null)

  return (
    <main className="min-h-dvh flex items-center justify-center bg-brand-50 px-4 py-[calc(2rem+var(--safe-top))]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Building2 className="w-8 h-8 text-brand-600 mx-auto mb-2" aria-hidden />
          <h1 className="text-xl font-bold text-neutral-900">佐藤畜産食品株式会社</h1>
          <p className="text-neutral-500 text-sm mt-1">社内アプリにログイン</p>
        </div>

        <form action={formAction} className="card p-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="input-field"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <div
              role="alert"
              className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3 border border-red-100"
            >
              {state.error}
            </div>
          )}

          <SubmitButton />

          <a
            href="/reset-password"
            className="block text-center text-sm text-brand-600 hover:underline pt-1"
          >
            パスワードをお忘れですか？
          </a>
        </form>

        <p className="text-center text-xs text-neutral-400 mt-6">
          アカウントは管理者が発行します。新規登録は行えません。
        </p>
      </div>
    </main>
  )
}
