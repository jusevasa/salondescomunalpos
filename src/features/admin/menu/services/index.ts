import { supabase } from '@/lib/config/supabase'
import type {
  MenuCategory,
  MenuItem,
  Side,
  CookingPoint,
  PrintStation,
  MenuCategoryFormData,
  MenuItemFormData,
  SideFormData,
  CookingPointFormData,
  PrintStationFormData,
  MenuCategoryFilters,
  MenuItemFilters,
  SideFilters,
  CookingPointFilters,
  PrintStationFilters,
  MenuCategoriesResponse,
  MenuItemsResponse,
  SidesResponse,
  CookingPointsResponse,
  PrintStationsResponse,
  ExcelMenuData,
  BulkUpdateMenuItems,
  BulkUpdateMenuCategories,
  MenuStats
} from '../types'

// Menu Categories Service
export const menuCategoriesService = {
  async getCategories(filters?: MenuCategoryFilters, page = 1, limit = 20): Promise<MenuCategoriesResponse> {
    try {
      let query = supabase
        .from('menu_categories')
        .select(`
          *,
          print_stations (
            id,
            name,
            code
          )
        `, { count: 'exact' })
        .order('display_order', { ascending: true })

      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active)
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }

      if (filters?.print_station_id) {
        query = query.eq('print_station_id', filters.print_station_id)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return {
        categories: data || [],
        total: count || 0,
        page,
        limit
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  },

  async createCategory(categoryData: MenuCategoryFormData): Promise<MenuCategory> {
    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .insert(categoryData)
        .select(`
          *,
          print_stations (
            id,
            name,
            code
          )
        `)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  },

  async updateCategory(id: number, categoryData: Partial<MenuCategoryFormData>): Promise<MenuCategory> {
    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .update({ ...categoryData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          print_stations (
            id,
            name,
            code
          )
        `)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating category:', error)
      throw error
    }
  },

  async deleteCategory(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting category:', error)
      throw error
    }
  },

  async bulkUpdateCategories(bulkUpdate: BulkUpdateMenuCategories): Promise<void> {
    try {
      const { error } = await supabase
        .from('menu_categories')
        .update({ ...bulkUpdate.updates, updated_at: new Date().toISOString() })
        .in('id', bulkUpdate.category_ids)

      if (error) throw error
    } catch (error) {
      console.error('Error bulk updating categories:', error)
      throw error
    }
  }
}

// Menu Items Service
export const menuItemsService = {
  async getItems(filters?: MenuItemFilters, page = 1, limit = 20): Promise<MenuItemsResponse> {
    try {
      let query = supabase
        .from('menu_items')
        .select(`
          *,
          menu_categories (
            id,
            name,
            print_stations (
              id,
              name,
              code
            )
          ),
          item_sides (
            id,
            side_id,
            sides (
              id,
              name
            )
          )
        `, { count: 'exact' })
        .order('name', { ascending: true })

      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active)
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }

      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id)
      }

      if (filters?.has_cooking_point !== undefined) {
        query = query.eq('has_cooking_point', filters.has_cooking_point)
      }

      if (filters?.has_sides !== undefined) {
        query = query.eq('has_sides', filters.has_sides)
      }

      if (filters?.price_min !== undefined) {
        query = query.gte('price', filters.price_min)
      }

      if (filters?.price_max !== undefined) {
        query = query.lte('price', filters.price_max)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return {
        items: data || [],
        total: count || 0,
        page,
        limit
      }
    } catch (error) {
      console.error('Error fetching menu items:', error)
      throw error
    }
  },

  async getItemById(id: number): Promise<MenuItem> {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          menu_categories (
            id,
            name,
            print_stations (
              id,
              name,
              code
            )
          ),
          item_sides (
            id,
            side_id,
            sides (
              id,
              name
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching menu item by id:', error)
      throw error
    }
  },

  async getItemByName(name: string): Promise<MenuItem | null> {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          category:menu_categories(id, name),
          item_sides(
            side:sides(id, name)
          )
        `)
        .eq('name', name)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null
        }
        throw error
      }
      return data
    } catch (error) {
      console.error('Error fetching menu item by name:', error)
      throw error
    }
  },

  async createItem(itemData: MenuItemFormData): Promise<MenuItem> {
    try {
      const { side_ids, ...menuItemData } = itemData

      const { data: menuItem, error: itemError } = await supabase
        .from('menu_items')
        .insert(menuItemData)
        .select()
        .single()

      if (itemError) throw itemError

      // Create item sides relationships if sides are selected
      if (side_ids && side_ids.length > 0) {
        const itemSidesData = side_ids.map(sideId => ({
          menu_item_id: menuItem.id,
          side_id: sideId
        }))

        const { error: sidesError } = await supabase
          .from('item_sides')
          .insert(itemSidesData)

        if (sidesError) throw sidesError
      }

      // Fetch the complete item with relationships
      return menuItemsService.getItemById(menuItem.id)
    } catch (error) {
      console.error('Error creating menu item:', error)
      throw error
    }
  },

  async upsertItem(itemData: MenuItemFormData): Promise<MenuItem> {
    try {
      // Verificar si el item ya existe por nombre
      const existingItem = await menuItemsService.getItemByName(itemData.name)
      
      if (existingItem) {
        // Si existe, actualizarlo
        console.log(`Actualizando item existente: ${itemData.name}`)
        return menuItemsService.updateItem(existingItem.id, itemData)
      } else {
        // Si no existe, crearlo
        console.log(`Creando nuevo item: ${itemData.name}`)
        return menuItemsService.createItem(itemData)
      }
    } catch (error) {
      console.error('Error upserting menu item:', error)
      throw error
    }
  },

  async updateItem(id: number, itemData: Partial<MenuItemFormData>): Promise<MenuItem> {
    try {
      const { side_ids, ...menuItemData } = itemData

      const { error } = await supabase
        .from('menu_items')
        .update({ ...menuItemData, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      // Update item sides relationships if side_ids is provided
      if (side_ids !== undefined) {
        // First, delete existing relationships
        const { error: deleteError } = await supabase
          .from('item_sides')
          .delete()
          .eq('menu_item_id', id)

        if (deleteError) throw deleteError

        // Then, create new relationships if any
        if (side_ids.length > 0) {
          const itemSidesData = side_ids.map(sideId => ({
            menu_item_id: id,
            side_id: sideId,
          }))

          const { error: insertError } = await supabase
            .from('item_sides')
            .insert(itemSidesData)

          if (insertError) throw insertError
        }
      }

      // Fetch the complete updated item with relations
      return menuItemsService.getItemById(id)
    } catch (error) {
      console.error('Error updating menu item:', error)
      throw error
    }
  },

  async deleteItem(id: number): Promise<void> {
    try {
      // Delete item sides first
      await supabase
        .from('item_sides')
        .delete()
        .eq('menu_item_id', id)

      // Delete the menu item
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting menu item:', error)
      throw error
    }
  },

  async bulkUpdateItems(bulkUpdate: BulkUpdateMenuItems): Promise<void> {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ ...bulkUpdate.updates, updated_at: new Date().toISOString() })
        .in('id', bulkUpdate.item_ids)

      if (error) throw error
    } catch (error) {
      console.error('Error bulk updating menu items:', error)
      throw error
    }
  },

  async bulkUpsertByName(items: MenuItemFormData[]): Promise<{ created: number; updated: number }> {
    if (!items || items.length === 0) return { created: 0, updated: 0 }

    const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ')

    // Deduplicar dentro del mismo batch por nombre normalizado (último gana)
    const dedupMap = new Map<string, MenuItemFormData>()
    for (const it of items) {
      const key = normalizeName(it.name).toLowerCase()
      dedupMap.set(key, { ...it, name: normalizeName(it.name) })
    }
    const deduped = Array.from(dedupMap.values())

    const names = Array.from(new Set(deduped.map(i => i.name)))

    const { data: existing, error: fetchError } = await supabase
      .from('menu_items')
      .select('id, name')
      .in('name', names)

    if (fetchError) throw fetchError

    const nameToId = new Map((existing || []).map(e => [normalizeName(e.name as string), e.id as number]))

    const nowIso = new Date().toISOString()

    // Importante: no incluir 'id' en ninguna fila para evitar insertar NULL en filas nuevas.
    // PostgREST usa un único INSERT con columnas unificadas; si alguna fila tiene 'id', las demás reciben NULL.
    const rows = deduped.map(i => ({
      name: normalizeName(i.name),
      price: i.price,
      base_price: i.base_price,
      category_id: i.category_id,
      active: i.active,
      tax: i.tax,
      fee: i.fee,
      author: i.author,
      has_cooking_point: i.has_cooking_point,
      has_sides: i.has_sides,
      max_sides_count: i.max_sides_count,
      updated_at: nowIso
    }))

    const { error: upsertError } = await supabase
      .from('menu_items')
      .upsert(rows, { onConflict: 'name' })

    if (upsertError) throw upsertError

    const created = rows.filter(r => !nameToId.has(r.name)).length
    const updated = rows.length - created

    return { created, updated }
  }
}

// Sides Service
export const sidesService = {
  async getSides(filters?: SideFilters, page = 1, limit = 50): Promise<SidesResponse> {
    try {
      let query = supabase
        .from('sides')
        .select('*', { count: 'exact' })
        .order('display_order', { ascending: true })

      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active)
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return {
        sides: data || [],
        total: count || 0,
        page,
        limit
      }
    } catch (error) {
      console.error('Error fetching sides:', error)
      throw error
    }
  },

  async createSide(sideData: SideFormData): Promise<Side> {
    try {
      const { data, error } = await supabase
        .from('sides')
        .insert(sideData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating side:', error)
      throw error
    }
  },

  async updateSide(id: number, sideData: Partial<SideFormData>): Promise<Side> {
    try {
      const { data, error } = await supabase
        .from('sides')
        .update({ ...sideData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating side:', error)
      throw error
    }
  },

  async deleteSide(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('sides')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting side:', error)
      throw error
    }
  }
}

// Cooking Points Service
export const cookingPointsService = {
  async getCookingPoints(filters?: CookingPointFilters, page = 1, limit = 50): Promise<CookingPointsResponse> {
    try {
      let query = supabase
        .from('cooking_points')
        .select('*', { count: 'exact' })
        .order('display_order', { ascending: true })

      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active)
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return {
        cooking_points: data || [],
        total: count || 0,
        page,
        limit
      }
    } catch (error) {
      console.error('Error fetching cooking points:', error)
      throw error
    }
  },

  async createCookingPoint(cookingPointData: CookingPointFormData): Promise<CookingPoint> {
    try {
      const { data, error } = await supabase
        .from('cooking_points')
        .insert(cookingPointData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating cooking point:', error)
      throw error
    }
  },

  async updateCookingPoint(id: number, cookingPointData: Partial<CookingPointFormData>): Promise<CookingPoint> {
    try {
      const { data, error } = await supabase
        .from('cooking_points')
        .update({ ...cookingPointData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating cooking point:', error)
      throw error
    }
  },

  async deleteCookingPoint(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('cooking_points')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting cooking point:', error)
      throw error
    }
  }
}

// Print Stations Service
export const printStationsService = {
  async getPrintStations(filters?: PrintStationFilters, page = 1, limit = 50): Promise<PrintStationsResponse> {
    try {
      let query = supabase
        .from('print_stations')
        .select('*', { count: 'exact' })
        .order('display_order', { ascending: true })

      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active)
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return {
        print_stations: data || [],
        total: count || 0,
        page,
        limit
      }
    } catch (error) {
      console.error('Error fetching print stations:', error)
      throw error
    }
  },

  async createPrintStation(printStationData: PrintStationFormData): Promise<PrintStation> {
    try {
      const { data, error } = await supabase
        .from('print_stations')
        .insert(printStationData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating print station:', error)
      throw error
    }
  },

  async updatePrintStation(id: number, printStationData: Partial<PrintStationFormData>): Promise<PrintStation> {
    try {
      const { data, error } = await supabase
        .from('print_stations')
        .update({ ...printStationData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating print station:', error)
      throw error
    }
  },

  async deletePrintStation(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('print_stations')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting print station:', error)
      throw error
    }
  },


}

// Excel Import/Export Service
export const excelService = {
  async importMenuFromExcel(excelData: ExcelMenuData): Promise<void> {
    try {
      // Start a transaction-like operation
      const { data: printStations } = await supabase
        .from('print_stations')
        .select('id, code')

      const printStationMap = new Map(
        printStations?.map(ps => [ps.code, ps.id]) || []
      )

      // Import categories first
      const categoryMap = new Map<string, number>()
      for (const categoryData of excelData.categories) {
        const printStationId = printStationMap.get(categoryData.print_station_code)
        if (!printStationId) {
          throw new Error(`Print station with code ${categoryData.print_station_code} not found`)
        }

        const { data: category } = await supabase
          .from('menu_categories')
          .insert({
            name: categoryData.name,
            description: categoryData.description,
            active: categoryData.active,
            display_order: categoryData.display_order,
            print_station_id: printStationId
          })
          .select()
          .single()

        if (category) {
          categoryMap.set(categoryData.name, category.id)
        }
      }

      // Import sides
      const sideMap = new Map<string, number>()
      for (const sideData of excelData.sides) {
        const { data: side } = await supabase
          .from('sides')
          .insert(sideData)
          .select()
          .single()

        if (side) {
          sideMap.set(sideData.name, side.id)
        }
      }

      // Import cooking points
      for (const cookingPointData of excelData.cooking_points) {
        await supabase
          .from('cooking_points')
          .insert(cookingPointData)
      }

      // Import menu items
      for (const itemData of excelData.items) {
        const categoryId = categoryMap.get(itemData.category_name)
        if (!categoryId) {
          throw new Error(`Category ${itemData.category_name} not found`)
        }

        const { side_names, ...menuItemData } = itemData
        const { data: menuItem } = await supabase
          .from('menu_items')
          .insert({
            ...menuItemData,
            category_id: categoryId
          })
          .select()
          .single()

        // Add sides if specified
        if (menuItem && side_names && side_names.length > 0) {
          const itemSides = side_names
            .map(sideName => {
              const sideId = sideMap.get(sideName)
              return sideId ? {
                menu_item_id: menuItem.id,
                side_id: sideId,
                max_quantity: 1
              } : null
            })
            .filter(Boolean)

          if (itemSides.length > 0) {
            await supabase
              .from('item_sides')
              .insert(itemSides)
          }
        }
      }
    } catch (error) {
      console.error('Error importing menu from Excel:', error)
      throw error
    }
  },

  async exportMenuToExcel(): Promise<ExcelMenuData> {
    try {
      const [categoriesRes, itemsRes, sidesRes, cookingPointsRes] = await Promise.all([
        supabase.from('menu_categories').select(`
          *,
          print_stations (code)
        `),
        supabase.from('menu_items').select(`
          *,
          menu_categories (name),
          item_sides (
            sides (name)
          )
        `),
        supabase.from('sides').select('*'),
        supabase.from('cooking_points').select('*')
      ])

      const categories = categoriesRes.data?.map(cat => ({
        name: cat.name,
        description: cat.description,
        active: cat.active,
        display_order: cat.display_order,
        print_station_code: cat.print_stations?.code || ''
      })) || []

      const items = itemsRes.data?.map(item => ({
          name: item.name,
          price: item.price,
          base_price: item.base_price,
          category_name: item.menu_categories?.name || '',
          active: item.active,
          tax: item.tax,
          fee: item.fee,
          author: item.author,
          has_cooking_point: item.has_cooking_point,
          has_sides: item.has_sides,
          side_names: item.item_sides?.map((itemSide: { sides?: { name: string } }) => itemSide.sides?.name).filter(Boolean) || []
        })) || []

      const sides = sidesRes.data?.map(side => ({
        name: side.name,
        active: side.active,
        display_order: side.display_order
      })) || []

      const cooking_points = cookingPointsRes.data?.map(cp => ({
        name: cp.name,
        active: cp.active,
        display_order: cp.display_order
      })) || []

      return {
        categories,
        items,
        sides,
        cooking_points
      }
    } catch (error) {
      console.error('Error exporting menu to Excel:', error)
      throw error
    }
  }
}

// Statistics Service
export const menuStatsService = {
  async getMenuStats(): Promise<MenuStats> {
    try {
      const [categoriesRes, itemsRes, sidesRes, cookingPointsRes, itemsByCategoryRes] = await Promise.all([
        supabase.from('menu_categories').select('active', { count: 'exact' }),
        supabase.from('menu_items').select('active, price', { count: 'exact' }),
        supabase.from('sides').select('*', { count: 'exact' }),
        supabase.from('cooking_points').select('*', { count: 'exact' }),
        supabase.from('menu_items').select(`
          menu_categories (name)
        `)
      ])

      const categories = categoriesRes.data || []
      const items = itemsRes.data || []
      const itemsByCategory = itemsByCategoryRes.data || []

      const activeCategories = categories.filter(c => c.active).length
      const activeItems = items.filter(i => i.active).length

      const prices = items.map(i => i.price).filter(p => p > 0)
      const priceRange = prices.length > 0 ? {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: prices.reduce((sum, price) => sum + price, 0) / prices.length
      } : { min: 0, max: 0, avg: 0 }

      const categoryCount = itemsByCategory.reduce((acc, item) => {
        const categoryName = (item.menu_categories as unknown as { name: string } | null)?.name || 'Sin categoría'
        acc[categoryName] = (acc[categoryName] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const items_by_category = Object.entries(categoryCount).map(([category_name, count]) => ({
        category_name,
        count
      }))

      return {
        total_categories: categoriesRes.count || 0,
        total_items: itemsRes.count || 0,
        total_sides: sidesRes.count || 0,
        total_cooking_points: cookingPointsRes.count || 0,
        active_categories: activeCategories,
        active_items: activeItems,
        items_by_category,
        price_range: priceRange
      }
    } catch (error) {
      console.error('Error fetching menu stats:', error)
      throw error
    }
  }
}