import { supabase } from '@/lib/config/supabase'
import type {  
  OrderFilters, 
  OrdersResponse, 
  DatabaseOrderItem, 
  PaymentMethod, 
  ProcessPaymentRequest,
  OrderItemToAdd,
  Payment
} from '../types'

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
        waiter: order.profiles?.name || 'Cliente',
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

  subscribeToOrders(callback: (payload: { eventType: string; new: any; old: any }) => void) {
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
  },

  async updateOrderItem(orderItemId: number, newQuantity: number) {
    try {
      // Get the current order item
      const { data: orderItem, error: fetchError } = await supabase
        .from('order_items')
        .select('*')
        .eq('id', orderItemId)
        .single()

      if (fetchError) throw fetchError

      if (newQuantity <= 0) {
        // Remove the item completely if quantity is 0 or less
        const { error: deleteError } = await supabase
          .from('order_items')
          .delete()
          .eq('id', orderItemId)

        if (deleteError) throw deleteError
      } else {
        // Update the quantity
        const newSubtotal = newQuantity * orderItem.unit_price

        const { error: updateError } = await supabase
          .from('order_items')
          .update({
            quantity: newQuantity,
            subtotal: newSubtotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderItemId)

        if (updateError) throw updateError
      }

      // Recalculate order totals
      await this.recalculateOrderTotals(orderItem.order_id)

      return { success: true }
    } catch (error) {
      console.error('Error updating order item:', error)
      throw error
    }
  },

  async removeOrderItem(orderItemId: number, quantityToRemove: number) {
    try {
      // Get the current order item
      const { data: orderItem, error: fetchError } = await supabase
        .from('order_items')
        .select('*')
        .eq('id', orderItemId)
        .single()

      if (fetchError) throw fetchError

      if (orderItem.quantity <= quantityToRemove) {
        // Remove the item completely
        const { error: deleteError } = await supabase
          .from('order_items')
          .delete()
          .eq('id', orderItemId)

        if (deleteError) throw deleteError
      } else {
        // Update the quantity
        const newQuantity = orderItem.quantity - quantityToRemove
        const newSubtotal = newQuantity * orderItem.unit_price

        const { error: updateError } = await supabase
          .from('order_items')
          .update({
            quantity: newQuantity,
            subtotal: newSubtotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderItemId)

        if (updateError) throw updateError
      }

      // Recalculate order totals
      await this.recalculateOrderTotals(orderItem.order_id)

      return { success: true }
    } catch (error) {
      console.error('Error removing order item:', error)
      throw error
    }
  },

  async addOrderItem(orderItem: OrderItemToAdd & { order_id: number }) {
    try {
      const subtotal = orderItem.quantity * orderItem.unit_price

      const { data, error } = await supabase
        .from('order_items')
        .insert({
          ...orderItem,
          subtotal,
        })
        .select()
        .single()

      if (error) throw error

      // Recalculate order totals
      await this.recalculateOrderTotals(orderItem.order_id)

      return data
    } catch (error) {
      console.error('Error adding order item:', error)
      throw error
    }
  },

  async recalculateOrderTotals(orderId: number) {
    try {
      // Get all order items
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('subtotal')
        .eq('order_id', orderId)

      if (itemsError) throw itemsError

      const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0)
      const taxAmount = subtotal * 0.08 // 8% tax
      const totalAmount = subtotal + taxAmount

      // Update order totals
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          grand_total: totalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (updateError) throw updateError

      return { subtotal, taxAmount, totalAmount }
    } catch (error) {
      console.error('Error recalculating order totals:', error)
      throw error
    }
  }
}

export const paymentService = {
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('active', true)
        .order('display_order')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      throw error
    }
  },

  async processPayment(request: ProcessPaymentRequest): Promise<Payment> {
    try {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', request.orderId)
        .single()

      if (orderError) throw orderError

      // Calculate payment details
      let tipAmount = 0
      if (request.tipPercentage) {
        tipAmount = (order.total_amount * request.tipPercentage) / 100
      } else if (request.tipAmount) {
        tipAmount = request.tipAmount
      }

      const totalToPay = order.total_amount + tipAmount
      const changeAmount = request.receivedAmount ? Math.max(0, request.receivedAmount - totalToPay) : 0

      // Create payment record
      const paymentData = {
        order_id: request.orderId,
        payment_method_id: request.paymentMethodId,
        amount: order.total_amount,
        tip_amount: tipAmount,
        tip_percentage: request.tipPercentage,
        total_paid: totalToPay,
        received_amount: request.receivedAmount,
        change_amount: changeAmount,
        status: 'completed' as const,
        notes: request.notes
      }

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single()

      if (paymentError) throw paymentError

      // Update order with payment info
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({
          tip_amount: tipAmount,
          grand_total: totalToPay,
          paid_amount: totalToPay,
          change_amount: changeAmount,
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', request.orderId)

      if (orderUpdateError) throw orderUpdateError

      return payment
    } catch (error) {
      console.error('Error processing payment:', error)
      throw error
    }
  },

  async getOrderPayments(orderId: number): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          payment_method:payment_methods(*)
        `)
        .eq('order_id', orderId)
        .order('created_at')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching order payments:', error)
      throw error
    }
  }
}