import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'
import { ordersService } from '../services'
import type { OrderFilters } from '../types'

export const useOrders = (filters?: OrderFilters) => {
  return useQuery({
    queryKey: ['orders', 'today', filters],
    queryFn: () => ordersService.getTodayOrders(filters),
    refetchInterval: 30000,
    staleTime: 10000,
    retry: 2,
    retryDelay: 1000,
  })
}

export const useOrdersSubscription = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    console.log('Setting up orders subscription hook...')
    
    const unsubscribe = ordersService.subscribeToOrders((payload) => {
      console.log('Received real-time update:', payload)
      
      // Invalidate and refetch orders data
      queryClient.invalidateQueries({ 
        queryKey: ['orders'],
        exact: false 
      })
      
      // Optionally show a toast notification here
      console.log('✅ Orders data refreshed due to real-time update')
    })

    return () => {
      console.log('Cleaning up orders subscription...')
      unsubscribe()
    }
  }, [queryClient])
}

export const useCreateTestOrder = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ordersService.createTestOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      console.log('✅ Test order created successfully')
    },
    onError: (error) => {
      console.error('❌ Error creating test order:', error)
    }
  })
} 