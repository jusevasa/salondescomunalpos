import { createClient } from '@supabase/supabase-js'
import { validateEnv, validateAdminEnv } from './env'
import type { Database } from '@/types/database'

const { SUPABASE_URL, SUPABASE_ANON_KEY } = validateEnv()

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'salon-de-comunal@1.0.0',
    },
  },
})

// Cliente admin para operaciones que requieren service role
let supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null

export const getSupabaseAdmin = () => {
  if (!supabaseAdmin) {
    try {
      const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = validateAdminEnv()
      supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            'X-Client-Info': 'salon-de-comunal-admin@1.0.0',
          },
        },
      })
    } catch (error) {
      console.warn('Admin client not available:', error)
      return null
    }
  }
  return supabaseAdmin
}