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

  // Transformar items de la orden a formato de factura
  const invoiceItems: InvoiceMenuItem[] = []

  // Si tenemos order_items (datos de base de datos)
  if (order.order_items && order.order_items.length > 0) {
    order.order_items.forEach(dbItem => {
      if (dbItem.menu_items) {
        invoiceItems.push({
          menu_item_id: dbItem.menu_items.id,
          menu_item_name: dbItem.menu_items.name,
          quantity: dbItem.quantity,
          unit_price: dbItem.unit_price,
          subtotal: dbItem.subtotal,
          tax_rate: 0.19, // 19% IVA por defecto
          tax_amount: dbItem.subtotal * 0.19,
          cooking_point: undefined, // No disponible en este contexto
          sides: [] // No disponible en este contexto
        })
      }
    })
  } 
  // Si tenemos items (formato simplificado)
  else if (order.items && order.items.length > 0) {
    order.items.forEach(item => {
      invoiceItems.push({
        menu_item_id: item.id,
        menu_item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.subtotal,
        tax_rate: 0.19, // 19% IVA por defecto
        tax_amount: item.subtotal * 0.19,
        cooking_point: undefined,
        sides: []
      })
    })
  }

  // Determinar información de pago
  const isCashPayment = paymentMethod.code === 'CASH'
  const paymentInfo: PaymentInfo = {
    method:paymentMethod.code.toLowerCase(),
    payment_method_name: paymentMethod.name,
    cash_amount: isCashPayment ? (receivedAmount || order.total_amount + tipAmount) : 0,
    card_amount: isCashPayment ? 0 : order.total_amount + tipAmount,
    tip_amount: tipAmount,
    change_amount: changeAmount
  }

  // Obtener información de mesa y mesero
  const tableNumber = order.table_number?.toString() || order.tables?.number || 'N/A'
  const waiterName = order.waiter || order.profiles?.name || 'N/A'

  // Construir request de factura
  const invoiceRequest: PrintInvoiceRequest = {
    order_id: parseInt(order.id),
    table_number: tableNumber,
    diners_count: order.diners_count,
    waiter_name: waiterName,
    created_at: order.created_at,
    items: invoiceItems,
    subtotal: order.subtotal,
    tax_amount: order.tax_amount,
    total_amount: order.total_amount,
    tip_amount: tipAmount,
    grand_total: order.total_amount + tipAmount,
    payment: paymentInfo,
    restaurant_info: RESTAURANT_INFO
  }

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