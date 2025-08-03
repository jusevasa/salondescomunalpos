import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/config/supabase'
import type { MenuItem, MenuCategory, Side, CookingPoint } from '../types'

export const useMenuData = () => {
  // Obtener categorías del menú
  const useMenuCategories = () => {
    return useQuery({
      queryKey: ['menuCategories'],
      queryFn: async (): Promise<MenuCategory[]> => {
        const { data, error } = await supabase
          .from('menu_categories')
          .select('*')
          .eq('active', true)
          .order('display_order')

        if (error) throw error
        return data || []
      },
    })
  }

  // Obtener items del menú por categoría
  const useMenuItems = (categoryId?: number) => {
    return useQuery({
      queryKey: ['menuItems', categoryId],
      queryFn: async (): Promise<MenuItem[]> => {
        let query = supabase
          .from('menu_items')
          .select(`
            *,
            menu_categories(
              *,
              print_stations(*)
            )
          `)
          .eq('active', true)

        if (categoryId) {
          query = query.eq('category_id', categoryId)
        }

        const { data, error } = await query.order('name')

        if (error) throw error
        return data || []
      },
    })
  }

  // Buscar items del menú con texto optimizado para Supabase
  const useMenuItemsSearch = (searchTerm?: string, categoryId?: number | null) => {
    return useQuery({
      queryKey: ['menuItemsSearch', searchTerm, categoryId],
      queryFn: async (): Promise<MenuItem[]> => {
        let query = supabase
          .from('menu_items')
          .select(`
            *,
            menu_categories(
              *,
              print_stations(*)
            )
          `)
          .eq('active', true)

        // Apply category filter if provided (null means all categories)
        if (categoryId !== null && categoryId !== undefined) {
          query = query.eq('category_id', categoryId)
        }

        // Apply search filter if provided
        if (searchTerm && searchTerm.trim()) {
          // Use ilike for case-insensitive search
          query = query.ilike('name', `%${searchTerm.trim()}%`)
        }

        const { data, error } = await query.order('name')

        if (error) throw error
        return data || []
      },
      // Always enabled - we want to show all items when no filters are applied
    })
  }

  // Obtener sides disponibles
  const useSides = () => {
    return useQuery({
      queryKey: ['sides'],
      queryFn: async (): Promise<Side[]> => {
        const { data, error } = await supabase
          .from('sides')
          .select('*')
          .eq('active', true)
          .order('display_order')

        if (error) throw error
        return data || []
      },
    })
  }

  // Obtener sides específicos para un item del menú
  const useItemSides = (menuItemId?: number) => {
    return useQuery({
      queryKey: ['itemSides', menuItemId],
      queryFn: async (): Promise<Side[]> => {
        if (!menuItemId) return []

        const { data, error } = await supabase
          .from('item_sides')
          .select(`
            sides (
              id,
              name,
              active,
              display_order,
              created_at,
              updated_at
            )
          `)
          .eq('menu_item_id', menuItemId)
          .order('sides(display_order)')

        if (error) throw error
        
        // Extract sides from the nested structure and filter active ones
        const sides = data?.map((item: any) => item.sides).filter((side: any) => side && side.active) || []
        return sides
      },
      enabled: !!menuItemId, // Only run query if menuItemId is provided
    })
  }

  // Obtener puntos de cocción
  const useCookingPoints = () => {
    return useQuery({
      queryKey: ['cookingPoints'],
      queryFn: async (): Promise<CookingPoint[]> => {
        const { data, error } = await supabase
          .from('cooking_points')
          .select('*')
          .eq('active', true)
          .order('display_order')

        if (error) throw error
        return data || []
      },
    })
  }

  return {
    useMenuCategories,
    useMenuItems,
    useMenuItemsSearch,
    useSides,
    useItemSides,
    useCookingPoints,
  }
}