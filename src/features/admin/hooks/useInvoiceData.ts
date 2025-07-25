import { useState, useEffect, useCallback } from 'react'
import type { Order, PaymentMethod } from '../types'

// Tipos para los datos de factura persistidos
export interface InvoiceData {
  orderId: string
  orderData: Order
  paymentMethodId: number
  paymentMethodName: string
  tipAmount: number
  tipPercentage?: number
  tipMode: 'percentage' | 'amount'
  receivedAmount?: number
  changeAmount?: number
  notes?: string
  totalToPay: number
  timestamp: number
}

const INVOICE_STORAGE_KEY = 'pending_invoice_data'
const STORAGE_EXPIRY_TIME = 24 * 60 * 60 * 1000 // 24 horas

/**
 * Hook para manejar la persistencia de datos de factura en localStorage
 */
export const useInvoiceData = () => {
  const [pendingInvoiceData, setPendingInvoiceData] = useState<InvoiceData | null>(null)

  /**
   * Limpiar datos de factura del localStorage
   */
  const clearInvoiceData = useCallback(() => {
    try {
      localStorage.removeItem(INVOICE_STORAGE_KEY)
      setPendingInvoiceData(null)
      console.log('🗑️ Datos de factura eliminados del localStorage')
    } catch (error) {
      console.error('Error clearing invoice data from localStorage:', error)
    }
  }, [])

  /**
   * Cargar datos de factura desde localStorage
   */
  const loadInvoiceData = useCallback(() => {
    try {
      const stored = localStorage.getItem(INVOICE_STORAGE_KEY)
      if (!stored) {
        setPendingInvoiceData(null)
        return
      }

      const data: InvoiceData = JSON.parse(stored)
      
      // Verificar si los datos no han expirado
      const now = Date.now()
      if (now - data.timestamp > STORAGE_EXPIRY_TIME) {
        clearInvoiceData()
        return
      }

      setPendingInvoiceData(data)
    } catch (error) {
      console.error('Error loading invoice data from localStorage:', error)
      clearInvoiceData()
    }
  }, [clearInvoiceData])

  // Cargar datos del localStorage al inicializar
  useEffect(() => {
    loadInvoiceData()
  }, [loadInvoiceData])

  /**
   * Guardar datos de factura en localStorage
   */
  const saveInvoiceData = useCallback((
    order: Order,
    paymentMethod: PaymentMethod,
    tipAmount: number,
    tipMode: 'percentage' | 'amount',
    tipPercentage?: number,
    receivedAmount?: number,
    changeAmount?: number,
    notes?: string
  ) => {
    try {
      const totalToPay = order.total_amount + tipAmount

      const invoiceData: InvoiceData = {
        orderId: order.id,
        orderData: order,
        paymentMethodId: paymentMethod.id,
        paymentMethodName: paymentMethod.name,
        tipAmount,
        tipPercentage,
        tipMode,
        receivedAmount,
        changeAmount,
        notes,
        totalToPay,
        timestamp: Date.now()
      }

      localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(invoiceData))
      setPendingInvoiceData(invoiceData)
      
      console.log('✅ Datos de factura guardados en localStorage:', invoiceData)
    } catch (error) {
      console.error('Error saving invoice data to localStorage:', error)
    }
  }, [])

  /**
   * Verificar si hay datos de factura para una orden específica
   */
  const hasInvoiceDataForOrder = useCallback((orderId: string): boolean => {
    return pendingInvoiceData?.orderId === orderId
  }, [pendingInvoiceData])

  /**
   * Obtener datos de factura para una orden específica
   */
  const getInvoiceDataForOrder = useCallback((orderId: string): InvoiceData | null => {
    if (pendingInvoiceData?.orderId === orderId) {
      return pendingInvoiceData
    }
    return null
  }, [pendingInvoiceData])

  return {
    pendingInvoiceData,
    saveInvoiceData,
    clearInvoiceData,
    loadInvoiceData,
    hasInvoiceDataForOrder,
    getInvoiceDataForOrder
  }
}