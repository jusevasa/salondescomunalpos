// ============================================================================
// VALIDACIÓN DE CONTRATOS PARA SERVICIOS DE IMPRESIÓN
// ============================================================================

import type { 
  PrintOrderRequest, 
  PrintInvoiceRequest,
  PrintStation,
  CookingPoint,
  Side,
  PaymentInfo,
  RestaurantInfo
} from '../types/print'

// ============================================================================
// VALIDADORES PARA TIPOS BASE
// ============================================================================

export function validatePrintStation(station: any): station is PrintStation {
  return (
    typeof station === 'object' &&
    station !== null &&
    typeof station.id === 'number' &&
    typeof station.name === 'string' &&
    typeof station.code === 'string' &&
    typeof station.printer_ip === 'string'
  )
}

export function validateCookingPoint(point: any): point is CookingPoint {
  return (
    typeof point === 'object' &&
    point !== null &&
    typeof point.id === 'number' &&
    typeof point.name === 'string'
  )
}

export function validateSide(side: any): side is Side {
  return (
    typeof side === 'object' &&
    side !== null &&
    typeof side.id === 'number' &&
    typeof side.name === 'string'
  )
}

export function validatePaymentInfo(payment: any): payment is PaymentInfo {
  const validMethods = ['cash', 'card', 'mixed']
  
  return (
    typeof payment === 'object' &&
    payment !== null &&
    validMethods.includes(payment.method) &&
    typeof payment.payment_method_name === 'string' &&
    typeof payment.cash_amount === 'number' &&
    typeof payment.card_amount === 'number' &&
    typeof payment.tip_amount === 'number' &&
    typeof payment.change_amount === 'number'
  )
}

export function validateRestaurantInfo(info: any): info is RestaurantInfo {
  return (
    typeof info === 'object' &&
    info !== null &&
    typeof info.name === 'string' &&
    typeof info.address === 'string' &&
    typeof info.phone === 'string' &&
    typeof info.tax_id === 'string'
  )
}

// ============================================================================
// VALIDADOR PARA CONTRATO DE COMANDA
// ============================================================================

export function validatePrintOrderContract(data: any): data is PrintOrderRequest {
  try {
    // Validaciones básicas
    if (typeof data !== 'object' || data === null) {
      throw new Error('Los datos deben ser un objeto')
    }

    // Campos requeridos básicos
    const requiredFields = [
      'order_id', 'table_number', 'diners_count', 'waiter_name', 
      'created_at', 'print_groups', 'subtotal', 'tax_amount', 'total_amount'
    ]

    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Campo requerido faltante: ${field}`)
      }
    }

    // Validar tipos básicos
    if (typeof data.order_id !== 'number') {
      throw new Error('order_id debe ser un número')
    }

    if (typeof data.table_number !== 'string') {
      throw new Error('table_number debe ser una cadena')
    }

    if (typeof data.diners_count !== 'number') {
      throw new Error('diners_count debe ser un número')
    }

    if (typeof data.waiter_name !== 'string') {
      throw new Error('waiter_name debe ser una cadena')
    }

    if (typeof data.created_at !== 'string') {
      throw new Error('created_at debe ser una cadena (ISO date)')
    }

    // Validar order_notes (opcional)
    if (data.order_notes !== undefined && typeof data.order_notes !== 'string') {
      throw new Error('order_notes debe ser una cadena o undefined')
    }

    // Validar print_groups
    if (!Array.isArray(data.print_groups)) {
      throw new Error('print_groups debe ser un array')
    }

    for (const [index, group] of data.print_groups.entries()) {
      if (!validatePrintStation(group.print_station)) {
        throw new Error(`print_station inválida en grupo ${index}`)
      }

      if (!Array.isArray(group.items)) {
        throw new Error(`items debe ser un array en grupo ${index}`)
      }

      for (const [itemIndex, item] of group.items.entries()) {
        // Validar campos requeridos del item
        const itemRequiredFields = [
          'menu_item_id', 'menu_item_name', 'quantity', 'unit_price', 'subtotal', 'sides'
        ]

        for (const field of itemRequiredFields) {
          if (!(field in item)) {
            throw new Error(`Campo requerido faltante en item ${itemIndex} del grupo ${index}: ${field}`)
          }
        }

        // Validar tipos del item
        if (typeof item.menu_item_id !== 'number') {
          throw new Error(`menu_item_id debe ser número en item ${itemIndex} del grupo ${index}`)
        }

        if (typeof item.menu_item_name !== 'string') {
          throw new Error(`menu_item_name debe ser cadena en item ${itemIndex} del grupo ${index}`)
        }

        if (typeof item.quantity !== 'number') {
          throw new Error(`quantity debe ser número en item ${itemIndex} del grupo ${index}`)
        }

        if (typeof item.unit_price !== 'number') {
          throw new Error(`unit_price debe ser número en item ${itemIndex} del grupo ${index}`)
        }

        if (typeof item.subtotal !== 'number') {
          throw new Error(`subtotal debe ser número en item ${itemIndex} del grupo ${index}`)
        }

        // Validar cooking_point (opcional)
        if (item.cooking_point !== undefined && !validateCookingPoint(item.cooking_point)) {
          throw new Error(`cooking_point inválido en item ${itemIndex} del grupo ${index}`)
        }

        // Validar notes (opcional)
        if (item.notes !== undefined && typeof item.notes !== 'string') {
          throw new Error(`notes debe ser cadena en item ${itemIndex} del grupo ${index}`)
        }

        // Validar sides
        if (!Array.isArray(item.sides)) {
          throw new Error(`sides debe ser array en item ${itemIndex} del grupo ${index}`)
        }

        for (const [sideIndex, side] of item.sides.entries()) {
          if (!validateSide(side)) {
            throw new Error(`side inválido ${sideIndex} en item ${itemIndex} del grupo ${index}`)
          }
        }
      }
    }

    // Validar totales
    if (typeof data.subtotal !== 'number') {
      throw new Error('subtotal debe ser un número')
    }

    if (typeof data.tax_amount !== 'number') {
      throw new Error('tax_amount debe ser un número')
    }

    if (typeof data.total_amount !== 'number') {
      throw new Error('total_amount debe ser un número')
    }

    return true
  } catch (error) {
    console.error('Error validando contrato de comanda:', error)
    return false
  }
}

// ============================================================================
// VALIDADOR PARA CONTRATO DE FACTURA
// ============================================================================

export function validatePrintInvoiceContract(data: any): data is PrintInvoiceRequest {
  try {
    // Validaciones básicas
    if (typeof data !== 'object' || data === null) {
      throw new Error('Los datos deben ser un objeto')
    }

    // Campos requeridos básicos
    const requiredFields = [
      'order_id', 'table_number', 'diners_count', 'waiter_name', 'created_at',
      'items', 'subtotal', 'tax_amount', 'total_amount', 'tip_amount', 
      'grand_total', 'payment', 'restaurant_info'
    ]

    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Campo requerido faltante: ${field}`)
      }
    }

    // Validar tipos básicos (similares a comanda)
    if (typeof data.order_id !== 'number') {
      throw new Error('order_id debe ser un número')
    }

    if (typeof data.table_number !== 'string') {
      throw new Error('table_number debe ser una cadena')
    }

    if (typeof data.diners_count !== 'number') {
      throw new Error('diners_count debe ser un número')
    }

    if (typeof data.waiter_name !== 'string') {
      throw new Error('waiter_name debe ser una cadena')
    }

    if (typeof data.created_at !== 'string') {
      throw new Error('created_at debe ser una cadena (ISO date)')
    }

    // Validar items
    if (!Array.isArray(data.items)) {
      throw new Error('items debe ser un array')
    }

    for (const [index, item] of data.items.entries()) {
      // Validar campos requeridos del item de factura
      const itemRequiredFields = [
        'menu_item_id', 'menu_item_name', 'quantity', 'unit_price', 
        'subtotal', 'tax_rate', 'tax_amount', 'sides'
      ]

      for (const field of itemRequiredFields) {
        if (!(field in item)) {
          throw new Error(`Campo requerido faltante en item ${index}: ${field}`)
        }
      }

      // Validar tipos del item
      if (typeof item.menu_item_id !== 'number') {
        throw new Error(`menu_item_id debe ser número en item ${index}`)
      }

      if (typeof item.menu_item_name !== 'string') {
        throw new Error(`menu_item_name debe ser cadena en item ${index}`)
      }

      if (typeof item.quantity !== 'number') {
        throw new Error(`quantity debe ser número en item ${index}`)
      }

      if (typeof item.unit_price !== 'number') {
        throw new Error(`unit_price debe ser número en item ${index}`)
      }

      if (typeof item.subtotal !== 'number') {
        throw new Error(`subtotal debe ser número en item ${index}`)
      }

      if (typeof item.tax_rate !== 'number') {
        throw new Error(`tax_rate debe ser número en item ${index}`)
      }

      if (typeof item.tax_amount !== 'number') {
        throw new Error(`tax_amount debe ser número en item ${index}`)
      }

      // Validar cooking_point (opcional)
      if (item.cooking_point !== undefined && !validateCookingPoint(item.cooking_point)) {
        throw new Error(`cooking_point inválido en item ${index}`)
      }

      // Validar sides
      if (!Array.isArray(item.sides)) {
        throw new Error(`sides debe ser array en item ${index}`)
      }

      for (const [sideIndex, side] of item.sides.entries()) {
        if (!validateSide(side)) {
          throw new Error(`side inválido ${sideIndex} en item ${index}`)
        }
      }
    }

    // Validar totales
    if (typeof data.subtotal !== 'number') {
      throw new Error('subtotal debe ser un número')
    }

    if (typeof data.tax_amount !== 'number') {
      throw new Error('tax_amount debe ser un número')
    }

    if (typeof data.total_amount !== 'number') {
      throw new Error('total_amount debe ser un número')
    }

    if (typeof data.tip_amount !== 'number') {
      throw new Error('tip_amount debe ser un número')
    }

    if (typeof data.grand_total !== 'number') {
      throw new Error('grand_total debe ser un número')
    }

    // Validar payment
    if (!validatePaymentInfo(data.payment)) {
      throw new Error('payment inválido')
    }

    // Validar restaurant_info
    if (!validateRestaurantInfo(data.restaurant_info)) {
      throw new Error('restaurant_info inválido')
    }

    return true
  } catch (error) {
    console.error('Error validando contrato de factura:', error)
    return false
  }
}

// ============================================================================
// FUNCIÓN UTILITARIA PARA VALIDAR ANTES DE ENVIAR
// ============================================================================

export function validateBeforeSending(
  type: 'order' | 'invoice',
  data: any
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  try {
    if (type === 'order') {
      if (!validatePrintOrderContract(data)) {
        errors.push('El contrato de comanda no es válido')
      }
    } else if (type === 'invoice') {
      if (!validatePrintInvoiceContract(data)) {
        errors.push('El contrato de factura no es válido')
      }
    } else {
      errors.push('Tipo de validación no reconocido')
    }
  } catch (error) {
    errors.push(`Error durante la validación: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}