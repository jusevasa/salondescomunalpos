import { useAuthStore, initializeAuth } from '@/lib/auth/authStore'
import { useEffect } from 'react'

export function useAuth() {
  const store = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [])

  return store
} 