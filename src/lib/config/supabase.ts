import { createClient } from '@supabase/supabase-js'
import { validateEnv } from './env'
import type { Database } from '@/types/database'

const { SUPABASE_URL, SUPABASE_ANON_KEY } = validateEnv()

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
}) 