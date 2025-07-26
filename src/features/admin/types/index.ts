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
  waiter?: string
  payment_status?: PaymentStatus
}

export interface OrderItem {
  id: number
  name: string
  quantity: number
  price: number
  subtotal: number
  category?: string
}

export interface DatabaseOrderItem {
  id: number
  quantity: number
  unit_price: number
  subtotal: number
  menu_items?: {
    id: number
    name: string
    price: number
    base_price?: number
    tax: number
    category_id: number
    menu_categories?: {
      id: number
      name: string
    }
  }
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'paid' | 'cancelled'

export type PaymentStatus = 'pending' | 'completed' | 'paid' | 'cancelled'

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

// New payment-related types
export interface PaymentMethod {
  id: number
  name: string
  code: string
  active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface Payment {
  id: number
  order_id: number
  payment_method_id: number
  amount: number
  tip_amount: number
  tip_percentage?: number
  total_paid: number
  received_amount?: number
  change_amount: number
  reference_number?: string
  status: PaymentStatus
  notes?: string
  created_at: string
  updated_at: string
  payment_method?: PaymentMethod
}

export interface ProcessPaymentRequest {
  orderId: number
  paymentMethodId: number
  tipAmount?: number
  tipPercentage?: number
  receivedAmount?: number
  notes?: string
}

export interface PaymentCalculation {
  orderAmount: number
  tipAmount: number
  totalToPay: number
  receivedAmount: number
  changeAmount: number
}

// Order modification types
export interface OrderItemToRemove {
  id: number
  quantity: number
}

export interface OrderItemToAdd {
  menu_item_id: number
  quantity: number
  unit_price: number
  cooking_point_id?: number
  notes?: string
}

// Tables management types
export interface Table {
  id: number
  number: string
  capacity: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface TableFormData {
  number: string
  capacity: number
  active: boolean
}

export interface TableFilters {
  active?: boolean
  search?: string
}

export interface TablesResponse {
  tables: Table[]
  total: number
  page: number
  limit: number
}

// Reports types
export interface ReportsFilters {
  date_from: string
  date_to: string
}

export interface CategorySalesReport {
  category_id: number
  category_name: string
  total_amount: number
  total_quantity: number
  items_count: number
}

export interface AuthorSalesReport {
  author: string
  total_amount: number
  total_commission: number
  net_amount: number
  total_quantity: number
  items_count: number
  categories: {
    category_name: string
    amount: number
    commission: number
    quantity: number
    items_count: number
  }[]
}

export interface SalesReportData {
  total_categories_amount: number
  total_tips: number
  total_revenue: number
  categories_sales: CategorySalesReport[]
  authors_sales: AuthorSalesReport[]
  date_from: string
  date_to: string
}