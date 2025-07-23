export interface Order {
  id: string
  created_at: string
  table_id: number
  profile_id: string
  diners_count: number
  status: OrderStatus
  subtotal: number
  tax_amount: number
  total_amount: number
  tip_amount: number
  grand_total: number
  paid_amount: number
  change_amount: number
  notes?: string
  items: OrderItem[]
  tables?: {
    id: number
    number: string
  }
  profiles?: {
    id: string
    name: string
  }
  order_items?: DatabaseOrderItem[]
  // Legacy fields for backward compatibility
  table_number?: number
  customer_name?: string
  payment_status?: PaymentStatus
}

export interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  subtotal: number
  category?: string
}

export interface DatabaseOrderItem {
  id: string
  quantity: number
  unit_price: number
  subtotal: number
  menu_items: {
    id: string
    name: string
    price: number
    category_id: number
    menu_categories: {
      id: number
      name: string
    }
  }
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'paid' | 'cancelled'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled'

export interface OrderFilters {
  status?: OrderStatus
  payment_status?: PaymentStatus
  date_range?: {
    from: Date
    to: Date
  }
  table_number?: number
}

export interface OrdersResponse {
  orders: Order[]
  total: number
  page: number
  limit: number
} 