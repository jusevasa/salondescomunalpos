// ============================================================================
// TIPOS PARA SERVICIOS DE IMPRESIÓN
// ============================================================================

// Tipos base para estaciones de impresión
export interface PrintStation {
  id: number
  name: string
  code: string
  printer_ip: string
}

// Tipos para puntos de cocción
export interface CookingPoint {
  id: number
  name: string
}

// Tipos para acompañamientos
export interface Side {
  id: number
  name: string
}

// Tipos para items de menú en impresión
export interface PrintMenuItem {
  menu_item_id: number
  menu_item_name: string
  quantity: number
  unit_price: number
  subtotal: number
  cooking_point?: CookingPoint
  notes?: string
  sides: Side[]
}

// Tipos para grupos de impresión (comandas)
export interface PrintGroup {
  print_station: PrintStation
  items: PrintMenuItem[]
}

// ============================================================================
// TIPOS PARA IMPRESIÓN DE COMANDAS
// ============================================================================

export interface PrintOrderRequest {
  order_id: number
  table_number: string
  diners_count: number
  waiter_name: string
  order_notes?: string
  created_at: string
  print_groups: PrintGroup[]
  subtotal: number
  tax_amount: number
  total_amount: number
}

export interface PrintOrderResponse {
  success: boolean
  message: string
  printed_stations?: string[]
  errors?: string[]
}

// ============================================================================
// TIPOS PARA IMPRESIÓN DE FACTURAS
// ============================================================================

export interface InvoiceMenuItem {
  menu_item_id: number
  menu_item_name: string
  quantity: number
  unit_price: number
  subtotal: number
  tax_rate: number
  tax_amount: number
  cooking_point?: CookingPoint
  sides: Side[]
}

export interface PaymentInfo {
  method: 'cash' | 'card' | 'mixed'
  payment_method_name: string
  cash_amount: number
  card_amount: number
  tip_amount: number
  change_amount: number
}

export interface RestaurantInfo {
  name: string
  address: string
  phone: string
  tax_id: string
}

export interface PrintInvoiceRequest {
  order_id: number
  table_number: string
  diners_count: number
  waiter_name: string
  created_at: string
  items: InvoiceMenuItem[]
  subtotal: number
  tax_amount: number
  total_amount: number
  tip_amount: number
  grand_total: number
  payment: PaymentInfo
  restaurant_info: RestaurantInfo
}

export interface PrintInvoiceResponse {
  success: boolean
  message: string
  invoice_number?: string
  errors?: string[]
}

// ============================================================================
// TIPOS PARA ERRORES Y RESPUESTAS GENERALES
// ============================================================================

export interface PrintError {
  code: string
  message: string
  details?: unknown
}

export interface PrintServiceError extends Error {
  code?: string
  details?: unknown
}