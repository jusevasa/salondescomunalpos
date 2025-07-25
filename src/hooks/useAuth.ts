import { useAuthStore, initializeAuth } from '@/lib/auth/authStore'
import { useEffect } from 'react'

export function useAuth() {
  const store = useAuthStore()

  useEffect(() => {
    initializeAuth()
    
    // Cleanup function
    return () => {
      // Only cleanup if this is the last component using auth
      // In a real app, you might want to use a ref counter
      // For now, we'll let the auth persist across component unmounts
    }
  }, [])

  return store
}