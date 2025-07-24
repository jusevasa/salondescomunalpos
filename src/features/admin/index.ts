// Components
export { 
  OrdersTable, 
  PaymentDialog, 
  OrderEditDialog,
  TablesTable,
  TableFormDialog
} from './components'

// Hooks
export {
  useOrders,
  useOrdersSubscription,
  useCreateTestOrder,
  usePaymentMethods,
  useProcessPayment,
  useOrderPayments,
  useRemoveOrderItem,
  useAddOrderItem,
  useTables,
  useTablesSubscription,
  useCreateTable,
  useUpdateTable,
  useDeleteTable
} from './hooks'

// Services
export { ordersService, paymentService, tablesService } from './services'

// Types
export type {
  Order,
  OrderItem,
  OrderFilters,
  OrdersResponse,
  PaymentMethod,
  Payment,
  ProcessPaymentRequest,
  PaymentCalculation,
  OrderItemToAdd,
  OrderItemToRemove,
  Table,
  TableFormData,
  TableFilters,
  TablesResponse
} from './types'