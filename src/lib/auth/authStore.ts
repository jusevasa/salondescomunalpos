import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'

import type { Profile, } from '@/types/database'
import type { LoginCredentials, RegisterCredentials } from '@/types/auth'
import { authService } from './services'

interface AuthStore {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  
  signIn: (credentials: LoginCredentials) => Promise<void>
  signUp: (credentials: RegisterCredentials) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector((set, get) => ({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,

    refreshProfile: async () => {
      try {
        const user = await authService.getCurrentUser()
        const profile = user ? await authService.getCurrentProfile() : null
        
        set({
          user,
          profile,
          isAuthenticated: Boolean(user && profile),
        })
      } catch (error) {
        console.error('Error refreshing profile:', error)
        set({
          user: null,
          profile: null,
          isAuthenticated: false,
        })
      }
    },

    signIn: async (credentials: LoginCredentials) => {
      set({ isLoading: true })
      try {
        await authService.signIn(credentials)
        await get().refreshProfile()
      } finally {
        set({ isLoading: false })
      }
    },

    signUp: async (credentials: RegisterCredentials) => {
      set({ isLoading: true })
      try {
        await authService.signUp(credentials)
        await get().refreshProfile()
      } finally {
        set({ isLoading: false })
      }
    },

    signOut: async () => {
      set({ isLoading: true })
      try {
        await authService.signOut()
        set({
          user: null,
          profile: null,
          isAuthenticated: false,
        })
      } finally {
        set({ isLoading: false })
      }
    },

    initialize: async () => {
      try {
        await get().refreshProfile()
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        set({ isLoading: false })
      }
    },
  }))
)

// Initialize auth state and setup listeners
let initialized = false
let authListener: { data: { subscription: { unsubscribe: () => void } } } | null = null

export const initializeAuth = () => {
  if (initialized) return
  initialized = true

  // Initialize on first call
  useAuthStore.getState().initialize()

  // Cleanup existing listener if any
  if (authListener) {
    authListener.data.subscription.unsubscribe()
  }

  // Setup auth state change listener
  authListener = authService.onAuthStateChange(async (event) => {
    try {
      const { refreshProfile } = useAuthStore.getState()
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await refreshProfile()
      } else if (event === 'SIGNED_OUT') {
        useAuthStore.setState({
          user: null,
          profile: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    } catch (error) {
      console.error('Error in auth state change listener:', error)
    }
  })
}

// Cleanup function for when the app unmounts
export const cleanupAuth = () => {
  if (authListener) {
    authListener.data.subscription.unsubscribe()
    authListener = null
  }
  initialized = false
}