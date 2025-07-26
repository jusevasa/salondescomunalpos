import { useState, useEffect, useCallback } from 'react'

const SIDEBAR_STORAGE_KEY = 'waiter_sidebar_state'

export function useSidebarPersistence(defaultOpen: boolean = false) {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load initial state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
      if (stored !== null) {
        setIsOpen(stored === 'true')
      }
    } catch (error) {
      console.warn('Failed to load sidebar state from localStorage:', error)
    } finally {
      setIsInitialized(true)
    }
  }, [])

  // Save state to localStorage whenever it changes
  const setSidebarOpen = useCallback((open: boolean | ((prev: boolean) => boolean)) => {
    setIsOpen(prevOpen => {
      const newOpen = typeof open === 'function' ? open(prevOpen) : open
      
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(newOpen))
      } catch (error) {
        console.warn('Failed to save sidebar state to localStorage:', error)
      }
      
      return newOpen
    })
  }, [])

  return {
    isOpen,
    setIsOpen: setSidebarOpen,
    isInitialized
  }
}