import type { Order, PaymentMethod } from '../types'
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
        const quantity = dbItem.quantity || 1
        // IMPORTANTE: Para facturas usamos el price (precio final) no el unit_price (base_price)
        const unitPrice = dbItem.menu_items.price || 0
        const subtotal = unitPrice * quantity // Recalcular subtotal con el precio correcto
        const taxRate = dbItem.menu_items.tax || 0.08 // Usar el tax del menu_item o 19% por defecto
        const taxAmount = subtotal * taxRate
        
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
      const quantity = item.quantity || 1
      const unitPrice = item.price || 0
      const subtotal = item.subtotal || 0
      const taxRate = 0.19 // 19% IVA por defecto para items simplificados
      const taxAmount = subtotal * taxRate
      
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

  // Validar que tengamos al menos un item
  if (invoiceItems.length === 0) {
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
  const subtotal = order.subtotal || 0
  const taxAmount = order.tax_amount || 0
  const totalAmount = order.total_amount || 0
  const finalTipAmount = tipAmount || 0
  const grandTotal = totalAmount + finalTipAmount

  // Construir request de factura
  const invoiceRequest: PrintInvoiceRequest = {
    order_id: parseInt(order.id),
    table_number: tableNumber,
    diners_count: dinersCount,
    waiter_name: waiterName,
    created_at: order.created_at,
    items: invoiceItems,
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
    items_count: invoiceRequest.items.length,
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