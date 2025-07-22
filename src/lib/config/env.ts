export const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
} as const

export const validateEnv = () => {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = env
  
  if (!SUPABASE_URL) {
    throw new Error('Missing VITE_SUPABASE_URL environment variable')
  }
  
  if (!SUPABASE_ANON_KEY) {
    throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
  }
  
  return { SUPABASE_URL, SUPABASE_ANON_KEY }
} 