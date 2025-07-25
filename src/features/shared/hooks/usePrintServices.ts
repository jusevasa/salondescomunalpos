import { useMutation, useQuery } from '@tanstack/react-query'
import { printService } from '../services/printService'
import type {
  PrintOrderRequest,
  PrintOrderResponse,
  PrintInvoiceRequest,
  PrintInvoiceResponse
} from '../types/print'

// ============================================================================
// QUERY KEYS PARA REACT QUERY
// ============================================================================

export const printQueryKeys = {
  all: ['print'] as const,
  service: () => [...printQueryKeys.all, 'service'] as const,
  health: () => [...printQueryKeys.service(), 'health'] as const,
} as const

// ============================================================================
// HOOK PARA VERIFICAR ESTADO DEL SERVICIO DE IMPRESIÓN
// ============================================================================

/**
 * Hook para verificar si el servicio de impresión está disponible
 */
export const usePrintServiceHealth = () => {
  return useQuery({
    queryKey: printQueryKeys.health(),
    queryFn: () => printService.checkPrintService(),
    staleTime: 30000, // 30 segundos
    refetchInterval: 60000, // Verificar cada minuto
    retry: 2,
  })
}

// ============================================================================
// HOOK PARA IMPRESIÓN DE COMANDAS
// ============================================================================

/**
 * Hook para imprimir comandas usando React Query mutation
 */
export const usePrintOrder = () => {
  return useMutation<PrintOrderResponse, Error, PrintOrderRequest>({
    mutationFn: (orderData: PrintOrderRequest) => printService.printOrder(orderData),
    onSuccess: (data, variables) => {
      console.log('✅ Comanda impresa exitosamente:', {
        order_id: variables.order_id,
        table_number: variables.table_number,
        response: data
      })
    },
    onError: (error, variables) => {
      console.error('❌ Error al imprimir comanda:', {
        order_id: variables.order_id,
        table_number: variables.table_number,
        error: error.message
      })
    },
  })
}

// ============================================================================
// HOOK PARA IMPRESIÓN DE FACTURAS
// ============================================================================

/**
 * Hook para imprimir facturas usando React Query mutation
 */
export const usePrintInvoice = () => {
  return useMutation<PrintInvoiceResponse, Error, PrintInvoiceRequest>({
    mutationFn: (invoiceData: PrintInvoiceRequest) => printService.printInvoice(invoiceData),
    onSuccess: (data, variables) => {
      console.log('✅ Factura impresa exitosamente:', {
        order_id: variables.order_id,
        table_number: variables.table_number,
        invoice_number: data.invoice_number,
        response: data
      })
    },
    onError: (error, variables) => {
      console.error('❌ Error al imprimir factura:', {
        order_id: variables.order_id,
        table_number: variables.table_number,
        error: error.message
      })
    },
  })
}

// ============================================================================
// HOOK COMBINADO PARA AMBOS SERVICIOS
// ============================================================================

/**
 * Hook que combina ambos servicios de impresión para facilitar su uso
 */
export const usePrintServices = () => {
  const printOrderMutation = usePrintOrder()
  const printInvoiceMutation = usePrintInvoice()
  const serviceHealth = usePrintServiceHealth()

  return {
    // Mutations
    printOrder: printOrderMutation.mutateAsync,
    printInvoice: printInvoiceMutation.mutateAsync,
    
    // Estados de loading
    isPrintingOrder: printOrderMutation.isPending,
    isPrintingInvoice: printInvoiceMutation.isPending,
    isPrinting: printOrderMutation.isPending || printInvoiceMutation.isPending,
    
    // Estados de error
    orderError: printOrderMutation.error,
    invoiceError: printInvoiceMutation.error,
    
    // Estado del servicio
    isServiceAvailable: serviceHealth.data ?? false,
    isCheckingService: serviceHealth.isLoading,
    serviceError: serviceHealth.error,
    
    // Métodos de reset
    resetOrderError: printOrderMutation.reset,
    resetInvoiceError: printInvoiceMutation.reset,
    
    // Configuración del servicio
    serviceConfig: printService.getConfig(),
  }
}

// ============================================================================
// TIPOS AUXILIARES PARA TYPESCRIPT
// ============================================================================

export type PrintOrderMutation = ReturnType<typeof usePrintOrder>
export type PrintInvoiceMutation = ReturnType<typeof usePrintInvoice>
export type PrintServicesHook = ReturnType<typeof usePrintServices>