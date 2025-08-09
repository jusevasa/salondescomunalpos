import type { Order, PaymentMethod } from '../types'
import { roundCOP, safeNumber } from '@/lib/utils'
import type {
  PrintInvoiceRequest,
  InvoiceMenuItem,
  PaymentInfo,
  RestaurantInfo
} from '@/features/shared/types/print'

interface TransformOrderToInvoiceParams {
  order: Order
  paymentMethod: PaymentMethod
  tipAmount: number
  tipPercentage?: number
  receivedAmount?: number
  changeAmount?: number
  notes?: string
}

/**
 * Información del restaurante (esto debería venir de configuración)
 */
const RESTAURANT_INFO: RestaurantInfo = {
  name: 'Salóndescomunal',
  address: 'Cl. 75 #20c-21, Bogotá',
  phone: '+57 314 7137999',
  tax_id: 'NIT: 901.180.886-8'
}

/**
 * Agrupa items duplicados por menu_item_id y unit_price
 * 
 * Esta función toma una lista de items de factura y agrupa aquellos que tienen
 * el mismo menu_item_id y unit_price, sumando sus cantidades y recalculando
 * los totales correspondientes.
 * 
 * Ejemplo: Si hay 2 entradas de "Coca-Cola" con cantidad 1 cada una,
 * se agrupan en una sola entrada con cantidad 2.
 */
const groupInvoiceItems = (items: InvoiceMenuItem[]): InvoiceMenuItem[] => {
  const groupedMap = new Map<string, InvoiceMenuItem>()

  items.forEach(item => {
    // Crear clave única basada en menu_item_id y unit_price
    const key = `${item.menu_item_id}-${item.unit_price}`
    
    if (groupedMap.has(key)) {
      // Si ya existe, sumar cantidades y recalcular totales
      const existingItem = groupedMap.get(key)!
      const newQuantity = existingItem.quantity + item.quantity
      const newSubtotal = roundCOP(existingItem.unit_price * newQuantity)
      const newTaxAmount = roundCOP(newSubtotal * existingItem.tax_rate)

      groupedMap.set(key, {
        ...existingItem,
        quantity: newQuantity,
        subtotal: newSubtotal,
        tax_amount: newTaxAmount
      })
    } else {
      // Si no existe, agregar el item tal como está
      groupedMap.set(key, { ...item })
    }
  })

  return Array.from(groupedMap.values())
}

/**
 * Transforma los datos de una orden a formato de factura para impresión
 */
export const transformOrderToInvoice = (params: TransformOrderToInvoiceParams): PrintInvoiceRequest => {
  const {
    order,
    paymentMethod,
    tipAmount,
    receivedAmount = 0,
    changeAmount = 0,
  } = params

  // Validar que la orden tenga un ID válido
  if (!order.id || isNaN(parseInt(order.id))) {
    throw new Error('La orden debe tener un ID válido para generar la factura')
  }

  // Transformar items de la orden a formato de factura
  const invoiceItems: InvoiceMenuItem[] = []

  // Si tenemos order_items (datos de base de datos)
  if (order.order_items && order.order_items.length > 0) {
    order.order_items.forEach(dbItem => {
      if (dbItem.menu_items) {
        // Asegurar que todos los valores numéricos sean válidos
        const quantity = safeNumber(dbItem.quantity, 1)
        // IMPORTANTE: Para facturas usamos el price (precio final) no el unit_price (base_price)
        const unitPrice = safeNumber(dbItem.menu_items.price, 0)
        const subtotal = roundCOP(unitPrice * quantity)
        const taxRate = safeNumber(dbItem.menu_items.tax, 0) / 100
        const taxAmount = roundCOP(subtotal * taxRate)

        invoiceItems.push({
          menu_item_id: dbItem.menu_items.id,
          menu_item_name: dbItem.menu_items.name,
          quantity: quantity,
          unit_price: unitPrice,
          subtotal: subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          cooking_point: undefined, // No disponible en este contexto
          sides: [] // No disponible en este contexto
        })
      }
    })
  }
  // Si tenemos items (formato simplificado)
  else if (order.items && order.items.length > 0) {
    order.items.forEach(item => {
      // Asegurar que todos los valores numéricos sean válidos
      const quantity = safeNumber(item.quantity, 1)
      const unitPrice = safeNumber(item.price, 0)
      const subtotal = roundCOP(safeNumber(item.subtotal, unitPrice * quantity))
      const taxRate = 0.19
      const taxAmount = roundCOP(subtotal * taxRate)

      invoiceItems.push({
        menu_item_id: item.id,
        menu_item_name: item.name,
        quantity: quantity,
        unit_price: unitPrice,
        subtotal: subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        cooking_point: undefined,
        sides: []
      })
    })
  }

  // Agrupar items duplicados
  const groupedInvoiceItems = groupInvoiceItems(invoiceItems)
  
  // Log de agrupación para debug
  if (invoiceItems.length !== groupedInvoiceItems.length) {
    console.log('📦 Items agrupados:', {
      items_originales: invoiceItems.length,
      items_agrupados: groupedInvoiceItems.length,
      items_reducidos: invoiceItems.length - groupedInvoiceItems.length
    })
  }

  // Validar que tengamos al menos un item
  if (groupedInvoiceItems.length === 0) {
    throw new Error('La orden debe tener al menos un item para generar la factura')
  }

  // Determinar información de pago
  const isCashPayment = paymentMethod.code === 'CASH'

  // Mapear códigos de métodos de pago a los valores esperados por la validación
  const getPaymentMethodCode = (code: string): 'cash' | 'card' | 'mixed' => {
    switch (code) {
      case 'CASH':
        return 'cash'
      case 'DEBIT_CARD':
      case 'CREDIT_CARD':
        return 'card'
      default:
        // Por defecto, si no es efectivo, asumimos tarjeta
        return code === 'CASH' ? 'cash' : 'card'
    }
  }

  const paymentInfo: PaymentInfo = {
    method: getPaymentMethodCode(paymentMethod.code),
    payment_method_name: paymentMethod.name,
    cash_amount: isCashPayment ? (receivedAmount || order.total_amount + tipAmount) : 0,
    card_amount: isCashPayment ? 0 : order.total_amount + tipAmount,
    tip_amount: tipAmount,
    change_amount: changeAmount
  }

  // Obtener información de mesa y mesero con valores por defecto más robustos
  const tableNumber = order.table_number?.toString() || order.tables?.number || order.table_id?.toString() || '1'
  const waiterName = order.waiter || order.profiles?.name || 'Mesero'
  const dinersCount = order.diners_count || 1 // Asegurar que siempre sea un número válido

  // Asegurar que todos los totales sean números válidos
  const subtotal = roundCOP(safeNumber(order.subtotal, 0))
  const taxAmount = roundCOP(safeNumber(order.tax_amount, 0))
  const totalAmount = roundCOP(safeNumber(order.total_amount, 0))
  const finalTipAmount = roundCOP(safeNumber(tipAmount, 0))
  const grandTotal = roundCOP(totalAmount + finalTipAmount)

  // Construir request de factura
  const invoiceRequest: PrintInvoiceRequest = {
    order_id: parseInt(order.id),
    table_number: tableNumber,
    diners_count: dinersCount,
    waiter_name: waiterName,
    created_at: order.created_at,
    items: groupedInvoiceItems,
    subtotal: subtotal,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    tip_amount: finalTipAmount,
    grand_total: grandTotal,
    payment: paymentInfo,
    restaurant_info: RESTAURANT_INFO
  }

  // Debug logging
  console.log('🧾 Datos de factura generados:', {
    order_id: invoiceRequest.order_id,
    table_number: invoiceRequest.table_number,
    diners_count: invoiceRequest.diners_count,
    waiter_name: invoiceRequest.waiter_name,
    original_items_count: invoiceItems.length,
    grouped_items_count: invoiceRequest.items.length,
    items_detail: invoiceRequest.items.map(item => ({
      name: item.menu_item_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal
    })),
    payment_method: invoiceRequest.payment.method,
    totals: {
      subtotal: invoiceRequest.subtotal,
      tax_amount: invoiceRequest.tax_amount,
      total_amount: invoiceRequest.total_amount,
      tip_amount: invoiceRequest.tip_amount,
      grand_total: invoiceRequest.grand_total
    }
  })

  return invoiceRequest
}

/**
 * Valida que los datos de la orden sean suficientes para generar una factura
 */
export const validateOrderForInvoice = (order: Order): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!order.id) {
    errors.push('ID de orden requerido')
  }

  if (!order.subtotal || order.subtotal <= 0) {
    errors.push('Subtotal debe ser mayor a 0')
  }

  if (!order.total_amount || order.total_amount <= 0) {
    errors.push('Total debe ser mayor a 0')
  }

  // Verificar que tenga items
  const hasItems = (order.order_items && order.order_items.length > 0) ||
    (order.items && order.items.length > 0)

  if (!hasItems) {
    errors.push('La orden debe tener al menos un item')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}