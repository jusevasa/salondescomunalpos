export interface Table {
  id: number
  number: string
  capacity: number
  active: boolean
  created_at: string
  updated_at: string
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
}

export type WaiterView = 'tables' | 'orders'