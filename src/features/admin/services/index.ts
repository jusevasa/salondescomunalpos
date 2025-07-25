import { supabase } from '@/lib/config/supabase'
import type {  
  OrderFilters, 
  OrdersResponse, 
  DatabaseOrderItem, 
  PaymentMethod, 
  ProcessPaymentRequest,
  OrderItemToAdd,
  Payment,
  Table,
  TableFormData,
  TableFilters,
  TablesResponse,
  ReportsFilters,
  SalesReportData,
  CategorySalesReport,
  AuthorSalesReport
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

  subscribeToOrders(callback: (payload: { eventType: string; new: unknown; old: unknown }) => void) {
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

export const tablesService = {
  async getTables(filters?: TableFilters): Promise<TablesResponse> {
    try {
      let query = supabase
        .from('tables')
        .select('*', { count: 'exact' })
        .order('number', { ascending: true })

      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active)
      }

      if (filters?.search) {
        query = query.or(`number.ilike.%${filters.search}%`)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching tables:', error)
        throw new Error(`Error al cargar las mesas: ${error.message}`)
      }

      return {
        tables: data || [],
        total: count || 0,
        page: 1,
        limit: 50
      }
    } catch (error) {
      console.error('Service error:', error)
      throw error
    }
  },

  async createTable(tableData: TableFormData): Promise<Table> {
    try {
      const { data, error } = await supabase
        .from('tables')
        .insert(tableData)
        .select()
        .single()

      if (error) {
        console.error('Error creating table:', error)
        throw new Error(`Error al crear la mesa: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Service error:', error)
      throw error
    }
  },

  async updateTable(id: number, tableData: Partial<TableFormData>): Promise<Table> {
    try {
      const { data, error } = await supabase
        .from('tables')
        .update({
          ...tableData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating table:', error)
        throw new Error(`Error al actualizar la mesa: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Service error:', error)
      throw error
    }
  },

  async deleteTable(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting table:', error)
        throw new Error(`Error al eliminar la mesa: ${error.message}`)
      }
    } catch (error) {
      console.error('Service error:', error)
      throw error
    }
  },

  subscribeToTables(callback: (payload: { eventType: string; new: unknown; old: unknown }) => void) {
    console.log('Setting up tables subscription...')
    
    const channel = supabase
      .channel('tables_realtime', {
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
          table: 'tables'
        },
        (payload) => {
          console.log('Tables update received:', payload)
          callback(payload)
        }
      )
      .subscribe((status) => {
        console.log('Tables subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to tables channel')
        }
      })

    return () => {
      console.log('Unsubscribing from tables channel...')
      supabase.removeChannel(channel)
    }
  }
}

export const reportsService = {
  async getSalesReport(filters: ReportsFilters): Promise<SalesReportData> {
    try {
      const { date_from, date_to } = filters

      // Adjust dates to include full day range
      const startDate = `${date_from} 00:00:00`
      const endDate = `${date_to} 23:59:59`

      // Get orders within date range with their items and categories
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          tip_amount,
          grand_total,
          created_at,
          order_items (
            id,
            quantity,
            unit_price,
            subtotal,
            menu_items (
              id,
              name,
              author,
              category_id,
              menu_categories (
                id,
                name
              )
            )
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('status', 'paid')

      if (ordersError) {
        console.error('Error fetching orders for reports:', ordersError)
        throw new Error(`Error al cargar los datos de reportes: ${ordersError.message}`)
      }

      const orders = ordersData || []

      // Calculate totals
      const totalTips = orders.reduce((sum, order) => sum + (order.tip_amount || 0), 0)
      const totalRevenue = orders.reduce((sum, order) => sum + (order.grand_total || 0), 0)
      const totalCategoriesAmount = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)

      // Calculate categories sales
      const categoriesMap = new Map<number, CategorySalesReport>()
      
      orders.forEach(order => {
        const orderItems = order.order_items as unknown[]
        orderItems?.forEach((item: unknown) => {
          const orderItem = item as {
            id: number
            quantity: number
            unit_price: number
            subtotal: number
            menu_items?: {
              id: number
              name: string
              author: string
              category_id: number
              menu_categories?: {
                id: number
                name: string
              }
            }
          }
          
          const menuItem = orderItem.menu_items
          const categoryId = menuItem?.category_id
          const categoryName = menuItem?.menu_categories?.name
          
          if (categoryId && categoryName) {
            const existing = categoriesMap.get(categoryId) || {
              category_id: categoryId,
              category_name: categoryName,
              total_amount: 0,
              total_quantity: 0,
              items_count: 0
            }

            existing.total_amount += orderItem.subtotal
            existing.total_quantity += orderItem.quantity
            existing.items_count += 1

            categoriesMap.set(categoryId, existing)
          }
        })
      })

      // Calculate authors sales by category
      const authorsMap = new Map<string, AuthorSalesReport>()
      
      orders.forEach(order => {
        const orderItems = order.order_items as unknown[]
        orderItems?.forEach((item: unknown) => {
          const orderItem = item as {
            id: number
            quantity: number
            unit_price: number
            subtotal: number
            menu_items?: {
              id: number
              name: string
              author: string
              category_id: number
              menu_categories?: {
                id: number
                name: string
              }
            }
          }
          
          const menuItem = orderItem.menu_items
          const author = menuItem?.author
          const categoryName = menuItem?.menu_categories?.name
          
          if (author && categoryName) {
            const key = `${author}-${categoryName}`
            const existing = authorsMap.get(key) || {
              author,
              category_name: categoryName,
              total_amount: 0,
              total_quantity: 0,
              items_count: 0
            }

            existing.total_amount += orderItem.subtotal
            existing.total_quantity += orderItem.quantity
            existing.items_count += 1

            authorsMap.set(key, existing)
          }
        })
      })

      return {
        total_categories_amount: totalCategoriesAmount,
        total_tips: totalTips,
        total_revenue: totalRevenue,
        categories_sales: Array.from(categoriesMap.values()).sort((a, b) => b.total_amount - a.total_amount),
        authors_sales: Array.from(authorsMap.values()).sort((a, b) => b.total_amount - a.total_amount),
        date_from,
        date_to
      }
    } catch (error) {
      console.error('Service error:', error)
      throw error
    }
  }
}