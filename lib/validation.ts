import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email({ message: 'メールアドレスの形式が正しくありません。' }),
  password: z.string().min(1, { message: 'パスワードを入力してください。' }),
})

export const resetSchema = z.object({
  email: z.string().email({ message: 'メールアドレスの形式が正しくありません。' }),
})

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  display_name: z.string().min(1),
  department: z.string().optional(),
  role: z.enum(['admin', 'manager', 'employee']),
})

export const roleChangeSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['admin', 'manager', 'employee']),
})
