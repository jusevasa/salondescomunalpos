import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/config/supabase'
import type { Order } from '../types'

export function useOrderById(orderId: number) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async (): Promise<Order | null> => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          table:tables(*),
          order_items(
            *,
            menu_item:menu_items(*),
            cooking_point:cooking_points(*),
            order_item_sides(
              *,
              side:sides(*)
            )
          )
        `)
        .eq('id', orderId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Order not found
        }
        throw error
      }

      return data as Order
    },
    enabled: orderId > 0,
  })
}