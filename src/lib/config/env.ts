export const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
  PRINT_API_URL: import.meta.env.VITE_PRINT_API_URL || '',
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

export const validateAdminEnv = () => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env
  
  if (!SUPABASE_URL) {
    throw new Error('Missing VITE_SUPABASE_URL environment variable')
  }
  
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing VITE_SUPABASE_SERVICE_ROLE_KEY environment variable')
  }
  
  return { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY }
}

export const validatePrintEnv = () => {
  const { PRINT_API_URL } = env
  
  if (!PRINT_API_URL) {
    throw new Error('Missing VITE_PRINT_API_URL environment variable')
  }
  
  return { PRINT_API_URL }
}