export interface Table {
  id: number
  number: string
  capacity: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface MenuCategory {
  id: number
  name: string
  description?: string
  active: boolean
  display_order: number
  print_station_id: number
  created_at: string
  updated_at: string
}

export interface MenuItem {
  id: number
  name: string
  price: number
  base_price?: number
  category_id: number
  active: boolean
  tax: number
  fee: number
  author: string
  has_cooking_point: boolean
  has_sides: boolean
  max_sides_count: number
  created_at: string
  updated_at: string
  menu_categories?: MenuCategory
}

export interface Side {
  id: number
  name: string
  active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface CookingPoint {
  id: number
  name: string
  active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id?: number
  order_id?: number
  menu_item_id: number
  quantity: number
  unit_price: number
  subtotal: number
  cooking_point_id?: number
  notes?: string
  created_at?: string
  updated_at?: string
  menu_item?: MenuItem
  sides?: Side[]
}

export interface Order {
  id: number
  table_id: number
  profile_id: string
  diners_count: number
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'paid' | 'cancelled'
  subtotal: number
  tax_amount: number
  total_amount: number
  tip_amount: number
  grand_total: number
  paid_amount: number
  change_amount: number
  notes?: string
  created_at: string
  updated_at: string
  table?: Table
  order_items?: OrderItem[]
}

export interface CreateOrderData {
  table_id: number
  diners_count: number
  notes?: string
}

export interface AddOrderItemData {
  menu_item_id: number
  quantity: number
  cooking_point_id?: number
  notes?: string
  sides?: number[]
}

export type WaiterView = 'tables' | 'orders'