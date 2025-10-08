import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'
import { ordersService, paymentService, tablesService, reportsService } from '../services'
import type { OrderFilters, ProcessPaymentRequest, OrderItemToAdd, TableFilters, TableFormData, ReportsFilters } from '../types'

export const useOrders = (filters?: OrderFilters) => {
  const dateKey = filters?.date_range
    ? `${filters.date_range.from.toDateString()}_${filters.date_range.to.toDateString()}`
    : 'today'
  return useQuery({
    queryKey: ['orders', dateKey, filters?.status, filters?.payment_status, filters?.table_number],
    queryFn: () => ordersService.getTodayOrders(filters),
    refetchInterval: 30000,
    staleTime: 10000,
    retry: 2,
    retryDelay: 1000,
    enabled: true,
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

// Payment hooks
export const usePaymentMethods = () => {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: paymentService.getPaymentMethods,
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}

export const useProcessPayment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (request: ProcessPaymentRequest) => paymentService.processPayment(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      console.log('✅ Payment processed successfully')
    },
    onError: (error) => {
      console.error('❌ Error processing payment:', error)
    }
  })
}

export const useOrderPayments = (orderId: number) => {
  return useQuery({
    queryKey: ['order-payments', orderId],
    queryFn: () => paymentService.getOrderPayments(orderId),
    enabled: !!orderId,
  })
}

export const useUpdateOrderItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ orderItemId, quantity }: { orderItemId: number; quantity: number }) => 
      ordersService.updateOrderItem(orderItemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      console.log('✅ Order item updated successfully')
    },
    onError: (error) => {
      console.error('❌ Error updating order item:', error)
    }
  })
}

export const useRemoveOrderItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ orderItemId, quantity }: { orderItemId: number; quantity: number }) => 
      ordersService.removeOrderItem(orderItemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      console.log('✅ Order item removed successfully')
    },
    onError: (error) => {
      console.error('❌ Error removing order item:', error)
    }
  })
}

export const useAddOrderItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (orderItem: OrderItemToAdd & { order_id: number }) => 
      ordersService.addOrderItem(orderItem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      console.log('✅ Order item added successfully')
    },
    onError: (error) => {
      console.error('❌ Error adding order item:', error)
    }
  })
}

// Tables hooks
export const useTables = (filters?: TableFilters) => {
  return useQuery({
    queryKey: ['tables', filters],
    queryFn: () => tablesService.getTables(filters),
    staleTime: 10000,
    retry: 2,
    retryDelay: 1000,
  })
}

export const useTablesSubscription = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    console.log('Setting up tables subscription hook...')
    
    const unsubscribe = tablesService.subscribeToTables((payload) => {
      console.log('Received tables real-time update:', payload)
      
      // Invalidate and refetch tables data
      queryClient.invalidateQueries({ 
        queryKey: ['tables'],
        exact: false 
      })
      
      console.log('✅ Tables data refreshed due to real-time update')
    })

    return () => {
      console.log('Cleaning up tables subscription...')
      unsubscribe()
    }
  }, [queryClient])
}

export const useCreateTable = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (tableData: TableFormData) => tablesService.createTable(tableData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      console.log('✅ Table created successfully')
    },
    onError: (error) => {
      console.error('❌ Error creating table:', error)
    }
  })
}

export const useUpdateTable = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TableFormData> }) => 
      tablesService.updateTable(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      console.log('✅ Table updated successfully')
    },
    onError: (error) => {
      console.error('❌ Error updating table:', error)
    }
  })
}

export const useDeleteTable = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => tablesService.deleteTable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      console.log('✅ Table deleted successfully')
    },
    onError: (error) => {
      console.error('❌ Error deleting table:', error)
    }
  })
}

export const useChangeOrderTable = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, newTableId }: { orderId: string | number; newTableId: number }) =>
      ordersService.updateOrderTable(orderId, newTableId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      console.log('✅ Order table changed successfully')
    },
    onError: (error) => {
      console.error('❌ Error changing order table:', error)
    }
  })
}

// Reports hooks
export const useSalesReport = (filters: ReportsFilters) => {
  return useQuery({
    queryKey: ['sales-report', filters],
    queryFn: () => reportsService.getSalesReport(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!(filters.date_from && filters.date_to),
  })
}

export const usePaidOrders = (filters: ReportsFilters) => {
  return useQuery({
    queryKey: ['paid-orders', filters],
    queryFn: () => reportsService.getPaidOrders(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!(filters.date_from && filters.date_to),
  })
}

// Invoice and printing hooks
export { useInvoiceData } from './useInvoiceData'
export { usePrintInvoiceFromPayment } from './usePrintInvoiceFromPayment'