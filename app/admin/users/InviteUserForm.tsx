'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createUser } from '../actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? '招待中...' : '招待を送信'}
    </button>
  )
}

export function InviteUserForm() {
  const [state, formAction] = useFormState(createUser, null)

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <input name="name" required placeholder="氏名" className="input-field" />
        <input name="display_name" required placeholder="表示名" className="input-field" />
        <input name="email" type="email" required placeholder="メールアドレス" className="input-field" />
        <input name="department" placeholder="部署（任意）" className="input-field" />
        <select name="role" defaultValue="employee" className="input-field">
          <option value="employee">社員</option>
          <option value="manager">マネージャー</option>
          <option value="admin">管理者</option>
        </select>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state?.success && <p className="text-sm text-brand-700">{state.success}</p>}

      <SubmitButton />
    </form>
  )
}
