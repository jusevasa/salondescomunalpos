// ============================================================================
// TIPOS UNIFICADOS PARA DATOS DE BASE DE DATOS
// ============================================================================

import type { CookingPoint, Side, PrintStation } from './print'

// ============================================================================
// TIPOS BASE DE TABLAS
// ============================================================================

export interface DatabaseTable {
  id: number
  number: string
  capacity: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface DatabaseProfile {
  id: string
  name: string
  email: string
  role: 'admin' | 'waiter'
  active: boolean
  created_at: string
  updated_at: string
}

export interface DatabaseMenuCategory {
  id: number
  name: string
  description?: string
  active: boolean
  display_order: number
  print_station_id?: number
  created_at: string
  updated_at: string
  print_stations?: PrintStation
}

export interface DatabaseMenuItem {
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
  menu_categories?: DatabaseMenuCategory
}

export interface DatabasePaymentMethod {
  id: number
  name: string
  code: string
  active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface DatabasePayment {
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
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
  payment_methods?: DatabasePaymentMethod
}

// ============================================================================
// TIPOS PARA ÓRDENES E ITEMS
// ============================================================================

export interface DatabaseOrderItem {
  id: number
  order_id: number
  menu_item_id: number
  quantity: number
  unit_price: number
  subtotal: number
  cooking_point_id?: number
  notes?: string
  created_at: string
  updated_at: string
  menu_items?: DatabaseMenuItem
  cooking_points?: CookingPoint
  order_item_sides?: {
    id: number
    order_item_id: number
    side_id: number
    quantity: number
    sides?: Side
  }[]
}

export interface DatabaseOrder {
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
  tables?: DatabaseTable
  profiles?: DatabaseProfile
  order_items?: DatabaseOrderItem[]
  payments?: DatabasePayment[]
}

// ============================================================================
// TIPOS PARA FORMULARIOS Y OPERACIONES
// ============================================================================

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

export interface UpdateOrderData {
  diners_count?: number
  notes?: string
  status?: DatabaseOrder['status']
}

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

export type OrderStatus = DatabaseOrder['status']
export type PaymentStatus = DatabasePayment['status']
export type UserRole = DatabaseProfile['role']