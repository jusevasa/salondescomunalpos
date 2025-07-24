// Components
export { 
  OrdersTable, 
  PaymentDialog, 
  OrderEditDialog,
  TablesTable,
  TableFormDialog
} from './components'

// Menu Components
export { MenuAdminDashboard } from './menu'

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

// Menu Hooks
export {
  useMenuCategories,
  useMenuItems,
  useSides,
  useCookingPoints,
  usePrintStations,
  useMenuStats
} from './menu'

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

// Menu Types and Validations
export type {
  MenuCategory,
  MenuItem,
  Side,
  CookingPoint,
  PrintStation,
  MenuCategoryFilters,
  MenuItemFilters,
  SideFilters,
  CookingPointFilters,
  PrintStationFilters,
  PaginationParams,
  SearchQuery
} from './menu'

// Menu Validations
export {
  menuCategoryFiltersSchema,
  menuItemFiltersSchema,
  sideFiltersSchema,
  cookingPointFiltersSchema,
  printStationFiltersSchema,
  paginationSchema,
  searchQuerySchema,
  validateFilters,
  parseSearchParams
} from './menu'