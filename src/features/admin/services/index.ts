import { supabase } from '@/lib/config/supabase'
import type {  OrderFilters, OrdersResponse, DatabaseOrderItem } from '../types'

export const ordersService = {
  async getTodayOrders(filters?: OrderFilters): Promise<OrdersResponse> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      let query = supabase
        .from('orders')
        .select(`
          *,
          tables (
            id,
            number
          ),
          profiles (
            id,
            name
          ),
          order_items (
            id,
            menu_items (
              id,
              name,
              price,
              category_id,
              menu_categories (
                id,
                name
              )
            ),
            quantity,
            unit_price,
            subtotal
          )
        `)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .order('created_at', { ascending: false })

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.payment_status) {
        query = query.eq('payment_status', filters.payment_status)
      }

      if (filters?.table_number) {
        query = query.eq('tables.number', filters.table_number.toString())
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching orders:', error)
        throw new Error(`Error al cargar las órdenes: ${error.message}`)
      }

      const orders = data?.map(order => ({
        ...order,
        // Legacy compatibility fields
        table_number: order.tables?.number ? parseInt(order.tables.number) : 0,
        customer_name: order.profiles?.name || 'Cliente',
        payment_status: order.paid_amount >= order.total_amount ? 'paid' as const : 'pending' as const,
        items: (order.order_items || []).map((item: DatabaseOrderItem) => ({
          id: item.id,
          name: item.menu_items?.name || 'Item desconocido',
          quantity: item.quantity,
          price: item.unit_price,
          subtotal: item.subtotal,
          category: item.menu_items?.menu_categories?.name || 'Sin categoría'
        }))
      })) || []

      return {
        orders,
        total: count || 0,
        page: 1,
        limit: 50
      }
    } catch (error) {
      console.error('Service error:', error)
      throw error
    }
  },

  subscribeToOrders(callback: (payload: any) => void) {
    console.log('Setting up orders subscription...')
    
    const channel = supabase
      .channel('orders_realtime', {
        config: {
          broadcast: { self: true },
          presence: { key: 'admin_user' }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Orders update received:', payload)
          callback(payload)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items'
        },
        (payload) => {
          console.log('Order items update received:', payload)
          callback(payload)
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to orders channel')
        }
      })

    return () => {
      console.log('Unsubscribing from orders channel...')
      supabase.removeChannel(channel)
    }
  },

  async createTestOrder() {
    // First get a random table and the current admin user
    const { data: tables } = await supabase.from('tables').select('id').eq('active', true).limit(10)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!tables?.length || !user) {
      throw new Error('No tables available or user not authenticated')
    }

    const randomTable = tables[Math.floor(Math.random() * tables.length)]
    const amount = Math.floor(Math.random() * 50000) + 10000

    const testOrder = {
      table_id: randomTable.id,
      profile_id: user.id,
      diners_count: Math.floor(Math.random() * 6) + 1,
      status: 'pending' as const,
      subtotal: amount,
      tax_amount: amount * 0.1,
      total_amount: amount * 1.1,
      tip_amount: 0,
      grand_total: amount * 1.1,
      paid_amount: 0,
      change_amount: 0,
      notes: 'Orden de prueba para testing'
    }

    const { data, error } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single()

    if (error) {
      console.error('Error creating test order:', error)
      throw error
    }

    return data
  }
} 