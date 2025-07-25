// ============================================================================
// EXPORTACIONES PRINCIPALES DE SHARED FEATURES
// ============================================================================

// ============================================================================
// EXPORTACIONES DE TIPOS
// ============================================================================

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
  PrintServiceError,
  RestaurantInfo,
} from './types/print'

export type {
  DatabaseOrder,
  DatabaseOrderItem,
  DatabaseTable,
  DatabaseProfile,
  DatabaseMenuItem,
  DatabaseMenuCategory,
  DatabasePayment,
  DatabasePaymentMethod,
  CreateOrderData,
  AddOrderItemData,
  UpdateOrderData,
  OrderStatus,
  PaymentStatus,
  UserRole,
} from './types/database'

// ============================================================================
// EXPORTACIONES DE SERVICIOS
// ============================================================================

export { printService } from './services/printService'

// ============================================================================
// EXPORTACIONES DE HOOKS
// ============================================================================

export {
  usePrintOrder,
  usePrintInvoice,
  usePrintServices,
  usePrintServiceHealth,
  printQueryKeys,
} from './hooks/usePrintServices'

export type {
  PrintOrderMutation,
  PrintInvoiceMutation,
  PrintServicesHook,
} from './hooks/usePrintServices'

// ============================================================================
// EXPORTACIONES DE UTILIDADES
// ============================================================================

export {
  transformOrderToPrintRequest,
  transformOrderToInvoiceRequest,
  validateOrderForPrinting,
} from './utils/printTransformers'

export {
  validatePrintOrderContract,
  validatePrintInvoiceContract,
} from './utils/contractValidation'