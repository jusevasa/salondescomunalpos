import { z } from 'zod'

// Base filter schema with common fields
const baseFilterSchema = z.object({
  active: z.boolean().optional(),
  search: z.string().trim().min(1).optional().or(z.literal('')),
})

// Menu Category Filters
export const menuCategoryFiltersSchema = baseFilterSchema.extend({
  print_station_id: z.number().int().positive().optional(),
})

// Menu Item Filters
export const menuItemFiltersSchema = baseFilterSchema.extend({
  category_id: z.number().int().positive().optional(),
  has_cooking_point: z.boolean().optional(),
  has_sides: z.boolean().optional(),
  price_min: z.number().min(0).optional(),
  price_max: z.number().min(0).optional(),
}).refine(
  (data) => {
    if (data.price_min !== undefined && data.price_max !== undefined) {
      return data.price_min <= data.price_max
    }
    return true
  },
  {
    message: "El precio mínimo debe ser menor o igual al precio máximo",
    path: ["price_min"],
  }
)

// Side Filters
export const sideFiltersSchema = baseFilterSchema

// Cooking Point Filters
export const cookingPointFiltersSchema = baseFilterSchema

// Print Station Filters
export const printStationFiltersSchema = baseFilterSchema

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
})

// Search query schema for general use
export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, "La búsqueda debe tener al menos 1 carácter").optional(),
})

// Form validation schemas
export const menuItemFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  price: z.number().min(0, 'El precio debe ser mayor a 0'),
  base_price: z.number().optional(),
  category_id: z.number().min(1, 'La categoría es requerida'),
  active: z.boolean().default(true),
  tax: z.number().min(0).max(100).default(8),
  fee: z.number().min(0).default(10),
  author: z.string().optional(),
  has_cooking_point: z.boolean().default(false),
  has_sides: z.boolean().default(false),
  max_sides_count: z.number().min(0).max(2).default(0),
  side_ids: z.array(z.number()).optional()
}).refine((data) => {
  if (data.has_sides) {
    return data.side_ids && data.side_ids.length > 0 && data.max_sides_count && data.max_sides_count > 0
  }
  return true
}, {
  message: 'Si el item tiene acompañamientos, debe seleccionar al menos uno y definir la cantidad máxima',
  path: ['side_ids']
})

// Explicit type for React Hook Form compatibility
export type MenuItemFormData = {
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
  max_sides_count: number
  side_ids?: number[]
}

export const menuCategoryFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "El nombre de la categoría es requerido")
    .max(50, "El nombre no puede exceder 50 caracteres"),
  description: z.string()
    .trim()
    .max(200, "La descripción no puede exceder 200 caracteres")
    .optional(),
  active: z.boolean(),
  display_order: z.number()
    .int()
    .min(1, "El orden debe ser al menos 1")
    .max(999, "El orden es demasiado alto"),
  print_station_id: z.number()
    .int()
    .min(1, "Debe seleccionar una estación de impresión")
})

export const sideFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "El nombre del acompañamiento es requerido")
    .max(50, "El nombre no puede exceder 50 caracteres"),
  active: z.boolean(),
  display_order: z.number()
    .int()
    .min(1, "El orden debe ser al menos 1")
    .max(999, "El orden es demasiado alto")
})

export const cookingPointFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "El nombre del punto de cocción es requerido")
    .max(50, "El nombre no puede exceder 50 caracteres"),
  active: z.boolean(),
  display_order: z.number()
    .int()
    .min(1, "El orden debe ser al menos 1")
    .max(999, "El orden es demasiado alto")
})

export const printStationFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "El nombre de la estación es requerido")
    .max(50, "El nombre no puede exceder 50 caracteres"),
  code: z.string()
    .trim()
    .min(1, "El código de la estación es requerido")
    .max(10, "El código no puede exceder 10 caracteres"),
  printer_ip: z.string()
    .trim()
    .regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, "Debe ser una dirección IP válida")
    .optional()
    .or(z.literal("")),
  active: z.boolean(),
  display_order: z.number()
    .int()
    .min(1, "El orden debe ser al menos 1")
    .max(999, "El orden es demasiado alto")
})

// Export types inferred from schemas
export type MenuCategoryFilters = z.infer<typeof menuCategoryFiltersSchema>
export type MenuItemFilters = z.infer<typeof menuItemFiltersSchema>
export type SideFilters = z.infer<typeof sideFiltersSchema>
export type CookingPointFilters = z.infer<typeof cookingPointFiltersSchema>
export type PrintStationFilters = z.infer<typeof printStationFiltersSchema>
export type PaginationParams = z.infer<typeof paginationSchema>
export type SearchQuery = z.infer<typeof searchQuerySchema>

// Form data types inferred from validation schemas
export type MenuCategoryFormData = z.infer<typeof menuCategoryFormSchema>
export type SideFormData = z.infer<typeof sideFormSchema>
export type CookingPointFormData = z.infer<typeof cookingPointFormSchema>
export type PrintStationFormData = z.infer<typeof printStationFormSchema>

// Utility function to validate and parse filters
export const validateFilters = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Filtros inválidos: ${error.issues.map((issue: z.ZodIssue) => issue.message).join(', ')}`)
    }
    throw error
  }
}

// Helper function to safely parse search params
export const parseSearchParams = (searchParams: URLSearchParams) => {
  const params: Record<string, unknown> = {}
  
  for (const [key, value] of searchParams.entries()) {
    // Convert string values to appropriate types
    if (value === 'true') {
      params[key] = true
    } else if (value === 'false') {
      params[key] = false
    } else if (!isNaN(Number(value)) && value !== '') {
      params[key] = Number(value)
    } else {
      params[key] = value
    }
  }
  
  return params
}