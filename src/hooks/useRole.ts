import { useAuthStore } from '@/lib/auth/authStore'
import type { UserRole } from '@/types/database'

export function useRole() {
  const profile = useAuthStore((state) => state.profile)

  const hasRole = (role: UserRole): boolean => {
    return profile?.role === role
  }

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return profile ? roles.includes(profile.role) : false
  }

  const isAdmin = (): boolean => {
    return hasRole('admin')
  }

  const isWaiter = (): boolean => {
    return hasRole('waiter')
  }

  return {
    role: profile?.role,
    hasRole,
    hasAnyRole,
    isAdmin,
    isWaiter,
  }
} 