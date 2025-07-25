import { useMutation } from '@tanstack/react-query'
import { usePrintInvoice } from '@/features/shared/hooks/usePrintServices'
import { transformOrderToInvoice } from '../utils/invoiceTransformers'
import type { Order, PaymentMethod } from '../types'
import type { InvoiceData } from './useInvoiceData'

interface PrintInvoiceParams {
  order: Order
  paymentMethod: PaymentMethod
  tipAmount: number
  tipPercentage?: number
  receivedAmount?: number
  changeAmount?: number
  notes?: string
}

/**
 * Hook para manejar la impresión de facturas desde el PaymentDialog
 */
export const usePrintInvoiceFromPayment = () => {
  const printInvoiceMutation = usePrintInvoice()

  const printInvoice = useMutation({
    mutationFn: async (params: PrintInvoiceParams) => {
      const {
        order,
        paymentMethod,
        tipAmount,
        tipPercentage,
        receivedAmount,
        changeAmount,
        notes
      } = params

      // Transformar los datos de la orden a formato de factura
      const invoiceData = transformOrderToInvoice({
        order,
        paymentMethod,
        tipAmount,
        tipPercentage,
        receivedAmount,
        changeAmount,
        notes
      })

      // Enviar a imprimir
      return await printInvoiceMutation.mutateAsync(invoiceData)
    },
    onSuccess: (data, variables) => {
      console.log('✅ Factura impresa exitosamente:', {
        order_id: variables.order.id,
        table_number: variables.order.table_number || variables.order.tables?.number,
        invoice_number: data.invoice_number
      })
    },
    onError: (error, variables) => {
      console.error('❌ Error al imprimir factura:', {
        order_id: variables.order.id,
        table_number: variables.order.table_number || variables.order.tables?.number,
        error: error.message
      })
    }
  })

  /**
   * Imprimir factura desde datos persistidos en localStorage
   */
  const printInvoiceFromStoredData = useMutation({
    mutationFn: async (invoiceData: InvoiceData) => {
      // Transformar los datos persistidos a formato de factura
      const printData = transformOrderToInvoice({
        order: invoiceData.orderData,
        paymentMethod: {
          id: invoiceData.paymentMethodId,
          name: invoiceData.paymentMethodName,
          code: '', // No necesario para impresión
          active: true,
          display_order: 0,
          created_at: '',
          updated_at: ''
        },
        tipAmount: invoiceData.tipAmount,
        tipPercentage: invoiceData.tipPercentage,
        receivedAmount: invoiceData.receivedAmount,
        changeAmount: invoiceData.changeAmount,
        notes: invoiceData.notes
      })

      // Enviar a imprimir
      return await printInvoiceMutation.mutateAsync(printData)
    },
    onSuccess: (data, variables) => {
      console.log('✅ Factura impresa desde datos persistidos:', {
        order_id: variables.orderId,
        invoice_number: data.invoice_number
      })
    },
    onError: (error, variables) => {
      console.error('❌ Error al imprimir factura desde datos persistidos:', {
        order_id: variables.orderId,
        error: error.message
      })
    }
  })

  return {
    printInvoice: printInvoice.mutateAsync,
    printInvoiceFromStoredData: printInvoiceFromStoredData.mutateAsync,
    isPrinting: printInvoice.isPending || printInvoiceFromStoredData.isPending,
    error: printInvoice.error || printInvoiceFromStoredData.error,
    reset: () => {
      printInvoice.reset()
      printInvoiceFromStoredData.reset()
    }
  }
}