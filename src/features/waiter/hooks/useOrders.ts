import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/config/supabase'
import type { Order } from '../types'

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          table:tables(*)
        `)
        .in('status', ['pending', 'preparing', 'ready', 'delivered'])
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })
}