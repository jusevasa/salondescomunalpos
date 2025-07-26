// Base interfaces for menu management
export interface MenuCategory {
  id: number
  name: string
  description?: string
  active: boolean
  display_order: number
  print_station_id: number
  created_at: string
  updated_at: string
  print_station?: PrintStation
  menu_items?: MenuItem[]
}

export interface MenuItem {
  id: number
  name: string
  price: number
  base_price?: number
  category_id: number
  active: boolean
  tax: number
  fee: number
  author: string
  has_cooking_point: boolean
  has_sides: boolean
  max_sides_count: number // Nueva propiedad
  created_at: string
  updated_at: string
  category?: MenuCategory
  item_sides?: ItemSide[]
  menu_categories?: {
    id: number
    name: string
  }
}

export interface Side {
  id: number
  name: string
  active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface ItemSide {
  id: number
  menu_item_id: number
  side_id: number
  created_at: string
  updated_at: string
  side?: Side
}

export interface CookingPoint {
  id: number
  name: string
  active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface PrintStation {
  id: number
  name: string
  code: string
  printer_ip?: string
  active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

// Form data interfaces - now using Zod validation schemas
export type {
  MenuItemFormData,
  MenuCategoryFormData,
  SideFormData,
  CookingPointFormData,
  PrintStationFormData
} from '../validations'

// Filter interfaces - now using Zod schemas
export type {
  MenuCategoryFilters,
  MenuItemFilters,
  SideFilters,
  CookingPointFilters,
  PrintStationFilters,
  PaginationParams,
  SearchQuery
} from '../validations'

// Response interfaces with pagination
export interface MenuCategoriesResponse {
  categories: MenuCategory[]
  total: number
  page: number
  limit: number
}

export interface MenuItemsResponse {
  items: MenuItem[]
  total: number
  page: number
  limit: number
}

export interface SidesResponse {
  sides: Side[]
  total: number
  page: number
  limit: number
}

export interface CookingPointsResponse {
  cooking_points: CookingPoint[]
  total: number
  page: number
  limit: number
}

export interface PrintStationsResponse {
  print_stations: PrintStation[]
  total: number
  page: number
  limit: number
}

// Excel import interfaces
export interface ExcelMenuData {
  categories: ExcelCategoryData[]
  items: ExcelItemData[]
  sides: ExcelSideData[]
  cooking_points: ExcelCookingPointData[]
}

export interface ExcelCategoryData {
  name: string
  description?: string
  active: boolean
  display_order: number
  print_station_code: string
}

export interface ExcelItemData {
  name: string
  price: number
  base_price?: number
  category_name: string
  active: boolean
  tax: number
  fee: number
  author: string
  has_cooking_point: boolean
  has_sides: boolean
  side_names?: string[] // Array of side names
}

export interface ExcelSideData {
  name: string
  active: boolean
  display_order: number
}

export interface ExcelCookingPointData {
  name: string
  active: boolean
  display_order: number
}

// Bulk operations
export interface BulkUpdateMenuItems {
  item_ids: number[]
  updates: Partial<import('../validations').MenuItemFormData>
}

export interface BulkUpdateMenuCategories {
  category_ids: number[]
  updates: Partial<import('../validations').MenuCategoryFormData>
}

// Statistics and analytics
export interface MenuStats {
  total_categories: number
  total_items: number
  total_sides: number
  total_cooking_points: number
  active_categories: number
  active_items: number
  items_by_category: { category_name: string; count: number }[]
  price_range: { min: number; max: number; avg: number }
}