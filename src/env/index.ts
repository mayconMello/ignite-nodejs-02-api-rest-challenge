import { config } from 'dotenv'
import { z } from 'zod'

config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' })

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_CLIENT: z.enum(['sqlite3', 'pg']),
  DATABASE_URL: z.string(),
  PORT: z.coerce.number().default(3000),
})

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  console.error('⚠️ Invalid environment variables!', _env.error.format())
  throw new Error('Invalid environment variables')
}

export const env = _env.data
