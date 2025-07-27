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
          table:tables(*),
          order_items(
            *,
            menu_item:menu_items(
              *,
              menu_categories(
                *,
                print_stations(*)
              )
            ),
            cooking_point:cooking_points(*),
            order_item_sides(
              *,
              side:sides(*)
            )
          )
        `)
        .in('status', ['pending', 'preparing', 'ready', 'delivered'])
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })
}