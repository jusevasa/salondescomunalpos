// ============================================================================
// EXPORTACIONES PRINCIPALES DE SHARED FEATURES
// ============================================================================

// Tipos
export type {
  PrintStation,
  CookingPoint,
  Side,
  PrintMenuItem,
  PrintGroup,
  PrintOrderRequest,
  PrintOrderResponse,
  InvoiceMenuItem,
  PaymentInfo,
  PrintInvoiceRequest,
  PrintInvoiceResponse,
  PrintError,
} from './types'

// Servicios
export { printService, PrintServiceError } from './services'
export type {
  PrintServiceErrorType,
} from './services'

// Exportar hooks
export {
  usePrintOrder,
  usePrintInvoice,
  usePrintServices,
  usePrintServiceHealth,
  printQueryKeys
} from './hooks'

export type {
  PrintOrderMutation,
  PrintInvoiceMutation,
  PrintServicesHook
} from './hooks'

// Exportar utilidades
export {
  transformOrderToPrintRequest,
  transformOrderToInvoiceRequest,
  validateOrderForPrinting,
  validateOrderForInvoicing
} from './utils/printTransformers'

// Exportaciones de utilidades de validación de contratos
export {
  validatePrintOrderContract,
  validatePrintInvoiceContract,
  validateBeforeSending
} from './utils/contractValidation'

export type {
  DatabaseOrder,
  DatabaseOrderItem,
  DatabasePayment
} from './utils/printTransformers'