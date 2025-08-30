import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { printService } from '@/features/shared/services/printService'
import {
  menuCategoriesService,
  menuItemsService,
  sidesService,
  cookingPointsService,
  printStationsService,
  excelService,
  menuStatsService
} from '../services'
import type {
  MenuCategoryFilters,
  MenuItemFilters,
  SideFilters,
  CookingPointFilters,
  PrintStationFilters,
  MenuCategoryFormData,
  MenuItemFormData,
  SideFormData,
  CookingPointFormData,
  PrintStationFormData,
  ExcelMenuData,
  BulkUpdateMenuItems,
  BulkUpdateMenuCategories
} from '../types'

// Query Keys
export const menuQueryKeys = {
  all: ['menu'] as const,
  categories: () => [...menuQueryKeys.all, 'categories'] as const,
  categoriesList: (filters?: MenuCategoryFilters, page?: number, limit?: number) =>
    [...menuQueryKeys.categories(), 'list', { filters, page, limit }] as const,
  items: () => [...menuQueryKeys.all, 'items'] as const,
  itemsList: (filters?: MenuItemFilters, page?: number, limit?: number) =>
    [...menuQueryKeys.items(), 'list', { filters, page, limit }] as const,
  sides: () => [...menuQueryKeys.all, 'sides'] as const,
  sidesList: (filters?: SideFilters, page?: number, limit?: number) =>
    [...menuQueryKeys.sides(), 'list', { filters, page, limit }] as const,
  cookingPoints: () => [...menuQueryKeys.all, 'cooking-points'] as const,
  cookingPointsList: (filters?: CookingPointFilters, page?: number, limit?: number) =>
    [...menuQueryKeys.cookingPoints(), 'list', { filters, page, limit }] as const,
  printStations: () => [...menuQueryKeys.all, 'print-stations'] as const,
  printStationsList: (filters?: PrintStationFilters, page?: number, limit?: number) =>
    [...menuQueryKeys.printStations(), 'list', { filters, page, limit }] as const,
  stats: () => [...menuQueryKeys.all, 'stats'] as const,
}

// Menu Categories Hooks
export const useMenuCategories = (
  filters?: MenuCategoryFilters,
  page = 1,
  limit = 20
) => {
  return useQuery({
    queryKey: menuQueryKeys.categoriesList(filters, page, limit),
    queryFn: () => menuCategoriesService.getCategories(filters, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateMenuCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MenuCategoryFormData) =>
      menuCategoriesService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.categories() })
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.stats() })
    },
    onError: (error) => {
      console.error('Error creating category:', error)
    },
  })
}

export const useUpdateMenuCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MenuCategoryFormData> }) =>
      menuCategoriesService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.categories() })
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.stats() })
    },
    onError: (error) => {
      console.error('Error updating category:', error)
    },
  })
}

export const useDeleteMenuCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => menuCategoriesService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.categories() })
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.items() })
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.stats() })
    },
    onError: (error) => {
      console.error('Error deleting category:', error)
    },
  })
}

export const useBulkUpdateMenuCategories = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkUpdateMenuCategories) =>
      menuCategoriesService.bulkUpdateCategories(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.categories() })
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.stats() })
    },
    onError: (error) => {
      console.error('Error bulk updating categories:', error)
    },
  })
}

// Menu Items Hooks
export const useMenuItems = (
  filters?: MenuItemFilters,
  page = 1,
  limit = 20
) => {
  return useQuery({
    queryKey: menuQueryKeys.itemsList(filters, page, limit),
    queryFn: () => menuItemsService.getItems(filters, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MenuItemFormData) => menuItemsService.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.items() })
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.stats() })
    },
    onError: (error) => {
      console.error('Error creating menu item:', error)
    },
  })
}

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MenuItemFormData> }) =>
      menuItemsService.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.items() })
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.stats() })
    },
    onError: (error) => {
      console.error('Error updating menu item:', error)
    },
  })
}

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => menuItemsService.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.items() })
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.stats() })
    },
    onError: (error) => {
      console.error('Error deleting menu item:', error)
    },
  })
}

export const useBulkUpdateMenuItems = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkUpdateMenuItems) =>
      menuItemsService.bulkUpdateItems(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.items() })
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.stats() })
    },
    onError: (error) => {
      console.error('Error bulk updating menu items:', error)
    },
  })
}

// Sides Hooks
export const useSides = (
  filters?: SideFilters,
  page = 1,
  limit = 50
) => {
  return useQuery({
    queryKey: menuQueryKeys.sidesList(filters, page, limit),
    queryFn: () => sidesService.getSides(filters, page, limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useCreateSide = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SideFormData) => sidesService.createSide(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.sides() })
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.stats() })
    },
    onError: (error) => {
      console.error('Error creating side:', error)
    },
  })
}

export const useUpdateSide = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SideFormData> }) =>
      sidesService.updateSide(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.sides() })
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.stats() })
    },
    onError: (error) => {
      console.error('Error updating side:', error)
    },
  })
}

export const useDeleteSide = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => sidesService.deleteSide(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.sides() })
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.items() })
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.stats() })
    },
    onError: (error) => {
      console.error('Error deleting side:', error)
    },
  })
}

// Cooking Points Hooks
export const useCookingPoints = (
  filters?: CookingPointFilters,
  page = 1,
  limit = 50
) => {
  return useQuery({
    queryKey: menuQueryKeys.cookingPointsList(filters, page, limit),
    queryFn: () => cookingPointsService.getCookingPoints(filters, page, limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useCreateCookingPoint = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CookingPointFormData) =>
      cookingPointsService.createCookingPoint(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.cookingPoints() })
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.stats() })
    },
    onError: (error) => {
      console.error('Error creating cooking point:', error)
    },
  })
}

export const useUpdateCookingPoint = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CookingPointFormData> }) =>
      cookingPointsService.updateCookingPoint(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.cookingPoints() })
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.stats() })
    },
    onError: (error) => {
      console.error('Error updating cooking point:', error)
    },
  })
}

export const useDeleteCookingPoint = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => cookingPointsService.deleteCookingPoint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.cookingPoints() })
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.stats() })
    },
    onError: (error) => {
      console.error('Error deleting cooking point:', error)
    },
  })
}

// Print Stations Hooks
export const usePrintStations = (
  filters?: PrintStationFilters,
  page = 1,
  limit = 50
) => {
  return useQuery({
    queryKey: menuQueryKeys.printStationsList(filters, page, limit),
    queryFn: () => printStationsService.getPrintStations(filters, page, limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useCreatePrintStation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PrintStationFormData) =>
      printStationsService.createPrintStation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.printStations() })
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.stats() })
    },
    onError: (error) => {
      console.error('Error creating print station:', error)
    },
  })
}

export const useUpdatePrintStation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PrintStationFormData> }) =>
      printStationsService.updatePrintStation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.printStations() })
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.stats() })
    },
    onError: (error) => {
      console.error('Error updating print station:', error)
    },
  })
}

export const useDeletePrintStation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => printStationsService.deletePrintStation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.printStations() })
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.categories() })
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.stats() })
    },
    onError: (error) => {
      console.error('Error deleting print station:', error)
    },
  })
}

export const useTestPrinterConnection = () => {
  return useMutation({
    mutationFn: (printerIp: string) => printService.testPrinterConnection(printerIp),
    onError: (error) => {
      console.error('Error testing printer connection:', error)
    },
  })
}

// Excel Import/Export Hooks
export const useImportMenuFromExcel = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ExcelMenuData) => excelService.importMenuFromExcel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.all })
    },
    onError: (error) => {
      console.error('Error importing menu from Excel:', error)
    },
  })
}

export const useExportMenuToExcel = () => {
  return useMutation({
    mutationFn: () => excelService.exportMenuToExcel(),
    onError: (error) => {
      console.error('Error exporting menu to Excel:', error)
    },
  })
}

// Menu Statistics Hook
export const useMenuStats = () => {
  return useQuery({
    queryKey: menuQueryKeys.stats(),
    queryFn: () => menuStatsService.getMenuStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Utility hooks for dropdowns and selects
export const useMenuCategoriesForSelect = () => {
  return useQuery({
    queryKey: [...menuQueryKeys.categories(), 'select'],
    queryFn: () => menuCategoriesService.getCategories({ active: true }, 1, 1000),
    select: (data) => data.categories.map(cat => ({
      value: cat.id.toString(),
      label: cat.name
    })),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useSidesForSelect = () => {
  return useQuery({
    queryKey: [...menuQueryKeys.sides(), 'select'],
    queryFn: () => sidesService.getSides({ active: true }, 1, 1000),
    select: (data) => data.sides.map(side => ({
      value: side.id.toString(),
      label: side.name
    })),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const usePrintStationsForSelect = () => {
  return useQuery({
    queryKey: [...menuQueryKeys.printStations(), 'select'],
    queryFn: () => printStationsService.getPrintStations({ active: true }, 1, 1000),
    select: (data) => data.print_stations.map(station => ({
      value: station.id.toString(),
      label: station.name
    })),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const usePrintStationsForInvoice = () => {
  return useQuery({
    queryKey: [...menuQueryKeys.printStations(), 'invoice'],
    queryFn: () => printStationsService.getPrintStations({ active: true }, 1, 1000),
    select: (data) => {
      const stations = data.print_stations
      const cajaStation = stations.find(station => station.code === 'CAJA')
      return {
        stations: stations.map(station => ({
          id: station.id,
          name: station.name,
          code: station.code,
          printer_ip: station.printer_ip
        })),
        defaultStation: cajaStation || stations[0] || null
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}