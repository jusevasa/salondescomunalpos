import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import type { 
  MenuItem, 
  MenuCategory, 
  Side, 
  CookingPoint, 
  PrintStation,
  MenuItemFormData 
} from '../types'

export interface ExcelImportResult {
  success: boolean
  data?: MenuItemFormData[]
  errors?: string[]
  totalRows: number
  validRows: number
}

export interface ExcelExportData {
  menuItems: MenuItem[]
  categories: MenuCategory[]
  sides: Side[]
  cookingPoints: CookingPoint[]
  printStations: PrintStation[]
}

interface ExcelRowData {
  'Nombre'?: string
  'Precio'?: number | string
  'Precio Base'?: number | string
  'Categoría'?: string
  'Activo'?: string
  'Impuesto'?: number | string
  'Tarifa'?: number | string
  'Autor'?: string
  'Tiene Puntos de Cocción'?: string
  'Tiene Acompañamientos'?: string
}

class ExcelService {
  // Exportar menú completo a Excel
  async exportMenu(data: ExcelExportData): Promise<void> {
    const workbook = XLSX.utils.book_new()

    // Hoja 1: Items del Menú
    const menuItemsData = data.menuItems.map(item => ({
      'ID': item.id,
      'Nombre': item.name,
      'Precio': item.price,
      'Precio Base': item.base_price,
      'Categoría': item.category?.name || '',
      'Activo': item.active ? 'Sí' : 'No',
      'Impuesto': item.tax || 0,
      'Tarifa': item.fee || 0,
      'Autor': item.author || '',
      'Tiene Puntos de Cocción': item.has_cooking_point ? 'Sí' : 'No',
      'Tiene Acompañamientos': item.has_sides ? 'Sí' : 'No',
      'Fecha Creación': new Date(item.created_at).toLocaleDateString('es-CO'),
      'Última Actualización': new Date(item.updated_at).toLocaleDateString('es-CO')
    }))

    const menuItemsSheet = XLSX.utils.json_to_sheet(menuItemsData)
    XLSX.utils.book_append_sheet(workbook, menuItemsSheet, 'Items del Menú')

    // Hoja 2: Categorías
    const categoriesData = data.categories.map(category => ({
      'ID': category.id,
      'Nombre': category.name,
      'Descripción': category.description || '',
      'Activo': category.active ? 'Sí' : 'No',
      'Orden': category.display_order,
      'Estación de Impresión': category.print_station?.name || '',
      'Total Items': category.menu_items?.length || 0,
      'Fecha Creación': new Date(category.created_at).toLocaleDateString('es-CO')
    }))

    const categoriesSheet = XLSX.utils.json_to_sheet(categoriesData)
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Categorías')

    // Hoja 3: Acompañamientos
    const sidesData = data.sides.map(side => ({
      'ID': side.id,
      'Nombre': side.name,
      'Activo': side.active ? 'Sí' : 'No',
      'Orden': side.display_order,
      'Fecha Creación': new Date(side.created_at).toLocaleDateString('es-CO')
    }))

    const sidesSheet = XLSX.utils.json_to_sheet(sidesData)
    XLSX.utils.book_append_sheet(workbook, sidesSheet, 'Acompañamientos')

    // Hoja 4: Puntos de Cocción
    const cookingPointsData = data.cookingPoints.map(cp => ({
      'ID': cp.id,
      'Nombre': cp.name,
      'Activo': cp.active ? 'Sí' : 'No',
      'Orden': cp.display_order,
      'Fecha Creación': new Date(cp.created_at).toLocaleDateString('es-CO')
    }))

    const cookingPointsSheet = XLSX.utils.json_to_sheet(cookingPointsData)
    XLSX.utils.book_append_sheet(workbook, cookingPointsSheet, 'Puntos de Cocción')

    // Hoja 5: Estaciones de Impresión
    const printStationsData = data.printStations.map(ps => ({
      'ID': ps.id,
      'Nombre': ps.name,
      'IP': ps.printer_ip || '',
      'Activo': ps.active ? 'Sí' : 'No',
      'Fecha Creación': new Date(ps.created_at).toLocaleDateString('es-CO')
    }))

    const printStationsSheet = XLSX.utils.json_to_sheet(printStationsData)
    XLSX.utils.book_append_sheet(workbook, printStationsSheet, 'Estaciones de Impresión')

    // Generar archivo y descargar
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    const fileName = `menu_completo_${new Date().toISOString().split('T')[0]}.xlsx`
    saveAs(blob, fileName)
  }

  // Generar plantilla para importación
  async downloadTemplate(categories: MenuCategory[], sides: Side[], cookingPoints: CookingPoint[]): Promise<void> {
    const workbook = XLSX.utils.book_new()

    // Hoja principal: Plantilla de Items
    const templateData = [
      {
        'Nombre': 'Ejemplo: Hamburguesa Clásica',
        'Precio': 25000,
        'Precio Base': 20000,
        'Categoría': 'Platos Principales',
        'Activo': 'Sí',
        'Impuesto': 0,
        'Tarifa': 0,
        'Autor': 'Chef Principal',
        'Tiene Puntos de Cocción': 'Sí',
        'Tiene Acompañamientos': 'Sí'
      }
    ]

    const templateSheet = XLSX.utils.json_to_sheet(templateData)
    
    // Configurar ancho de columnas
    templateSheet['!cols'] = [
      { width: 25 }, // Nombre
      { width: 12 }, // Precio
      { width: 15 }, // Precio Base
      { width: 20 }, // Categoría
      { width: 10 }, // Activo
      { width: 12 }, // Impuesto
      { width: 12 }, // Tarifa
      { width: 15 }, // Autor
      { width: 25 }, // Puntos de Cocción
      { width: 25 }  // Acompañamientos
    ]

    XLSX.utils.book_append_sheet(workbook, templateSheet, 'Plantilla Items')

    // Hoja de referencia: Categorías disponibles
    const categoriesRef = categories.map(cat => ({ 'Categorías Disponibles': cat.name }))
    const categoriesSheet = XLSX.utils.json_to_sheet(categoriesRef)
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Categorías')

    // Hoja de referencia: Acompañamientos disponibles
    const sidesRef = sides.map(side => ({ 'Acompañamientos Disponibles': side.name }))
    const sidesSheet = XLSX.utils.json_to_sheet(sidesRef)
    XLSX.utils.book_append_sheet(workbook, sidesSheet, 'Acompañamientos')

    // Hoja de referencia: Puntos de cocción disponibles
    const cookingPointsRef = cookingPoints.map(cp => ({ 'Puntos de Cocción Disponibles': cp.name }))
    const cookingPointsSheet = XLSX.utils.json_to_sheet(cookingPointsRef)
    XLSX.utils.book_append_sheet(workbook, cookingPointsSheet, 'Puntos de Cocción')

    // Hoja de instrucciones
    const instructions = [
      { 'Campo': 'Nombre', 'Descripción': 'Nombre del item del menú (requerido)', 'Ejemplo': 'Hamburguesa Clásica' },
      { 'Campo': 'Precio', 'Descripción': 'Precio de venta (requerido, número)', 'Ejemplo': '25000' },
      { 'Campo': 'Precio Base', 'Descripción': 'Precio base sin impuestos (opcional, número)', 'Ejemplo': '20000' },
      { 'Campo': 'Categoría', 'Descripción': 'Nombre de la categoría (debe existir)', 'Ejemplo': 'Platos Principales' },
      { 'Campo': 'Activo', 'Descripción': 'Sí/No - Si el item está activo', 'Ejemplo': 'Sí' },
      { 'Campo': 'Impuesto', 'Descripción': 'Porcentaje de impuesto (opcional)', 'Ejemplo': '0' },
      { 'Campo': 'Tarifa', 'Descripción': 'Tarifa adicional (opcional)', 'Ejemplo': '0' },
      { 'Campo': 'Autor', 'Descripción': 'Nombre del autor/chef (opcional)', 'Ejemplo': 'Chef Principal' },
      { 'Campo': 'Tiene Puntos de Cocción', 'Descripción': 'Sí/No - Si el item tiene puntos de cocción', 'Ejemplo': 'Sí' },
      { 'Campo': 'Tiene Acompañamientos', 'Descripción': 'Sí/No - Si el item tiene acompañamientos', 'Ejemplo': 'Sí' }
    ]

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions)
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones')

    // Generar archivo y descargar
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    const fileName = `plantilla_menu_${new Date().toISOString().split('T')[0]}.xlsx`
    saveAs(blob, fileName)
  }

  // Importar items desde Excel
  async importMenuItems(
    file: File, 
    categories: MenuCategory[], 
    sides: Side[], 
    cookingPoints: CookingPoint[],
    onProgress?: (progress: number) => void
  ): Promise<ExcelImportResult> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          
          // Leer la primera hoja
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRowData[]

          const errors: string[] = []
          const validItems: MenuItemFormData[] = []
          let processedRows = 0

          jsonData.forEach((row: ExcelRowData, index: number) => {
            processedRows++
            onProgress?.(Math.round((processedRows / jsonData.length) * 100))

            try {
              // Validar campos requeridos
              if (!row['Nombre'] || typeof row['Nombre'] !== 'string') {
                errors.push(`Fila ${index + 2}: Nombre es requerido`)
                return
              }

              if (!row['Precio'] || isNaN(Number(row['Precio']))) {
                errors.push(`Fila ${index + 2}: Precio debe ser un número válido`)
                return
              }

              // Buscar categoría
              const categoryName = row['Categoría']
              const category = categories.find(cat => 
                cat.name.toLowerCase() === categoryName?.toLowerCase()
              )

              if (categoryName && !category) {
                errors.push(`Fila ${index + 2}: Categoría "${categoryName}" no encontrada`)
                return
              }

              // Crear item válido
              const item: MenuItemFormData = {
                name: row['Nombre'],
                price: Number(row['Precio']),
                base_price: row['Precio Base'] ? Number(row['Precio Base']) : 0,
                category_id: category?.id || 0,
                active: row['Activo']?.toLowerCase() === 'sí' || row['Activo']?.toLowerCase() === 'si',
                tax: row['Impuesto'] ? Number(row['Impuesto']) : 0,
                fee: row['Tarifa'] ? Number(row['Tarifa']) : 0,
                author: row['Autor'] || '',
                has_cooking_point: row['Tiene Puntos de Cocción']?.toLowerCase() === 'sí' || row['Tiene Puntos de Cocción']?.toLowerCase() === 'si',
                has_sides: row['Tiene Acompañamientos']?.toLowerCase() === 'sí' || row['Tiene Acompañamientos']?.toLowerCase() === 'si'
              }

              validItems.push(item)
            } catch (error) {
              errors.push(`Fila ${index + 2}: Error procesando datos - ${error}`)
            }
          })

          resolve({
            success: errors.length === 0,
            data: validItems,
            errors: errors.length > 0 ? errors : undefined,
            totalRows: jsonData.length,
            validRows: validItems.length
          })

        } catch (error) {
          resolve({
            success: false,
            errors: [`Error leyendo archivo: ${error}`],
            totalRows: 0,
            validRows: 0
          })
        }
      }

      reader.onerror = () => {
        resolve({
          success: false,
          errors: ['Error leyendo el archivo'],
          totalRows: 0,
          validRows: 0
        })
      }

      reader.readAsArrayBuffer(file)
    })
  }
}

export const excelService = new ExcelService()