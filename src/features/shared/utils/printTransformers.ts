import type {
  PrintOrderRequest,
  PrintInvoiceRequest,
  PrintGroup,
  PrintMenuItem,
  InvoiceMenuItem,
  RestaurantInfo
} from '../types/print'

// ============================================================================
// TIPOS PARA DATOS DE ENTRADA (DESDE LA BASE DE DATOS)
// ============================================================================

interface DatabaseOrder {
  id: number
  table_id: number
  profile_id: string
  diners_count: number
  status: string
  subtotal: number
  tax_amount: number
  total_amount: number
  tip_amount: number
  grand_total: number
  paid_amount: number
  change_amount: number
  notes?: string
  created_at: string
  tables?: {
    number: string
  }
  profiles?: {
    name: string
  }
  order_items?: DatabaseOrderItem[]
  payments?: DatabasePayment[]
}

interface DatabaseOrderItem {
  id: number
  menu_item_id: number
  quantity: number
  unit_price: number
  subtotal: number
  notes?: string
  menu_items?: {
    id: number
    name: string
    price: number
    category_id: number
    has_cooking_point: boolean
    tax: number
    fee: number
    has_sides: boolean
    menu_categories?: {
      id: number
      name: string
      print_station_id?: number
      print_stations?: {
        id: number
        name: string
        code: string
        printer_ip: string
      }
    }
  }
  order_item_cooking_points?: {
    cooking_point_id: number
    cooking_points?: {
      id: number
      name: string
    }
  }[]
  order_item_sides?: {
    side_id: number
    sides?: {
      id: number
      name: string
    }
  }[]
}

interface DatabasePayment {
  id: number
  payment_method_id: number
  amount: number
  payment_methods?: {
    id: number
    name: string
    code: string
  }
}

// ============================================================================
// UTILIDADES DE TRANSFORMACIÓN
// ============================================================================

/**
 * Transforma una orden de la base de datos al formato requerido para impresión de comandas
 */
export const transformOrderToPrintRequest = (order: DatabaseOrder): PrintOrderRequest => {
  // Agrupar items por estación de impresión
  const printGroups = groupItemsByPrintStation(order.order_items || [])

  return {
    order_id: order.id,
    table_number: order.tables?.number || order.table_id.toString(),
    diners_count: order.diners_count,
    waiter_name: order.profiles?.name || 'Mesero',
    order_notes: order.notes,
    created_at: order.created_at,
    print_groups: printGroups,
    subtotal: order.subtotal,
    tax_amount: order.tax_amount,
    total_amount: order.total_amount
  }
}

/**
 * Transforma una orden de la base de datos al formato requerido para impresión de facturas
 */
export const transformOrderToInvoiceRequest = (order: DatabaseOrder, restaurantInfo?: RestaurantInfo): PrintInvoiceRequest => {
  const items: InvoiceMenuItem[] = (order.order_items || []).map(item => ({
    menu_item_id: item.menu_item_id,
    menu_item_name: item.menu_items?.name || 'Item desconocido',
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: item.subtotal,
    tax_rate: item.menu_items?.tax || 0,
    tax_amount: item.subtotal * (item.menu_items?.tax || 0),
    cooking_point: item.order_item_cooking_points?.[0]?.cooking_points ? {
      id: item.order_item_cooking_points[0].cooking_points.id,
      name: item.order_item_cooking_points[0].cooking_points.name
    } : undefined,
    sides: (item.order_item_sides || []).map(side => ({
      id: side.sides?.id || 0,
      name: side.sides?.name || 'Acompañamiento'
    }))
  }))

  // Determinar método de pago
  const paymentInfo = determinePaymentMethod(order.payments || [], order.grand_total)

  // Información del restaurante por defecto
  const defaultRestaurantInfo: RestaurantInfo = {
    name: 'Salóndescomunal',
    address: 'Calle 123 #45-67, Bogotá',
    phone: '+57 1 234-5678',
    tax_id: '900123456-7'
  }

  return {
    order_id: order.id,
    table_number: order.tables?.number || order.table_id.toString(),
    diners_count: order.diners_count,
    waiter_name: order.profiles?.name || 'Mesero',
    created_at: order.created_at,
    items,
    subtotal: order.subtotal,
    tax_amount: order.tax_amount,
    total_amount: order.total_amount,
    tip_amount: order.tip_amount,
    grand_total: order.grand_total,
    payment: paymentInfo,
    restaurant_info: restaurantInfo || defaultRestaurantInfo
  }
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Agrupa los items de una orden por estación de impresión
 */
const groupItemsByPrintStation = (orderItems: DatabaseOrderItem[]): PrintGroup[] => {
  const stationGroups = new Map<number, {
    station: any
    items: PrintMenuItem[]
  }>()

  orderItems.forEach(item => {
    const printStation = item.menu_items?.menu_categories?.print_stations
    
    if (!printStation) {
      console.warn(`Item ${item.menu_item_id} no tiene estación de impresión asignada`)
      return
    }

    const stationId = printStation.id
    
    if (!stationGroups.has(stationId)) {
      stationGroups.set(stationId, {
        station: {
          id: printStation.id,
          name: printStation.name,
          code: printStation.code,
          printer_ip: printStation.printer_ip
        },
        items: []
      })
    }

    const printMenuItem: PrintMenuItem = {
      menu_item_id: item.menu_item_id,
      menu_item_name: item.menu_items?.name || 'Item desconocido',
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      cooking_point: item.order_item_cooking_points?.[0]?.cooking_points ? {
        id: item.order_item_cooking_points[0].cooking_points.id,
        name: item.order_item_cooking_points[0].cooking_points.name
      } : undefined,
      notes: item.notes,
      sides: (item.order_item_sides || []).map(side => ({
        id: side.sides?.id || 0,
        name: side.sides?.name || 'Acompañamiento'
      }))
    }

    stationGroups.get(stationId)!.items.push(printMenuItem)
  })

  return Array.from(stationGroups.values()).map(group => ({
    print_station: group.station,
    items: group.items
  }))
}

/**
 * Determina el método de pago basado en los pagos registrados
 */
const determinePaymentMethod = (payments: DatabasePayment[], grandTotal: number) => {
  if (payments.length === 0) {
    return {
      method: 'cash' as const,
      payment_method_name: 'Efectivo',
      cash_amount: grandTotal,
      card_amount: 0,
      tip_amount: 0,
      change_amount: 0
    }
  }

  let cashAmount = 0
  let cardAmount = 0
  let tipAmount = 0

  payments.forEach(payment => {
    const paymentCode = payment.payment_methods?.code?.toLowerCase()
    
    if (paymentCode === 'cash' || paymentCode === 'efectivo') {
      cashAmount += payment.amount
    } else if (paymentCode === 'card' || paymentCode === 'tarjeta') {
      cardAmount += payment.amount
    } else if (paymentCode === 'tip' || paymentCode === 'propina') {
      tipAmount += payment.amount
    }
  })

  const totalPaid = cashAmount + cardAmount
  const changeAmount = Math.max(0, totalPaid - grandTotal)

  let method: 'cash' | 'card' | 'mixed'
  let paymentMethodName: string

  if (cashAmount > 0 && cardAmount > 0) {
    method = 'mixed'
    paymentMethodName = 'Efectivo + Tarjeta'
  } else if (cardAmount > 0) {
    method = 'card'
    paymentMethodName = 'Tarjeta'
  } else {
    method = 'cash'
    paymentMethodName = 'Efectivo'
  }

  return {
    method,
    payment_method_name: paymentMethodName,
    cash_amount: cashAmount,
    card_amount: cardAmount,
    tip_amount: tipAmount,
    change_amount: changeAmount
  }
}

// ============================================================================
// VALIDACIONES
// ============================================================================

/**
 * Valida que una orden tenga los datos mínimos requeridos para impresión
 */
export const validateOrderForPrinting = (order: DatabaseOrder): string[] => {
  const errors: string[] = []

  if (!order.id) {
    errors.push('ID de orden requerido')
  }

  if (!order.table_id && !order.tables?.number) {
    errors.push('Número de mesa requerido')
  }

  if (!order.order_items || order.order_items.length === 0) {
    errors.push('La orden debe tener al menos un item')
  }

  if (order.subtotal <= 0) {
    errors.push('El subtotal debe ser mayor a 0')
  }

  // Validar que los items tengan estaciones de impresión
  const itemsWithoutStation = (order.order_items || []).filter(
    item => !item.menu_items?.menu_categories?.print_stations
  )

  if (itemsWithoutStation.length > 0) {
    errors.push(`${itemsWithoutStation.length} item(s) no tienen estación de impresión asignada`)
  }

  return errors
}

/**
 * Valida que una orden esté lista para facturación
 */
export const validateOrderForInvoicing = (order: DatabaseOrder): string[] => {
  const errors = validateOrderForPrinting(order)

  if (order.paid_amount < order.grand_total) {
    errors.push('La orden debe estar completamente pagada para facturar')
  }

  if (!order.payments || order.payments.length === 0) {
    errors.push('La orden debe tener información de pago registrada')
  }

  return errors
}

// ============================================================================
// EXPORTACIONES DE TIPOS
// ============================================================================

export type {
  DatabaseOrder,
  DatabaseOrderItem,
  DatabasePayment
}