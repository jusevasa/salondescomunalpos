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
  'Máximo Acompañamientos'?: number | string
}

class ExcelService {
  // Exportar menú completo a Excel
  async exportMenu(data: ExcelExportData): Promise<void> {
    const workbook = XLSX.utils.book_new()
    
    console.log(data.menuItems)
    // Hoja 1: Items del Menú (compatible con plantilla de importación)
    const menuItemsData = data.menuItems.map(item => ({
      'Nombre': item.name,
      'Precio': item.price,
      'Precio Base': item.base_price || '',
      'Categoría': item.menu_categories?.name || '',
      'Activo': item.active ? 'Sí' : 'No',
      'Impuesto': item.tax || 0,
      'Tarifa': item.fee || 0,
      'Autor': item.author || '',
      'Tiene Puntos de Cocción': item.has_cooking_point ? 'Sí' : 'No',
      'Tiene Acompañamientos': item.has_sides ? 'Sí' : 'No',
      'Máximo Acompañamientos': item.max_sides_count || 0
    }))

    const menuItemsSheet = XLSX.utils.json_to_sheet(menuItemsData)
    
    // Configurar ancho de columnas para la hoja de items (igual que la plantilla)
    menuItemsSheet['!cols'] = [
      { width: 25 }, // Nombre
      { width: 12 }, // Precio
      { width: 15 }, // Precio Base
      { width: 20 }, // Categoría
      { width: 10 }, // Activo
      { width: 12 }, // Impuesto
      { width: 12 }, // Tarifa
      { width: 15 }, // Autor
      { width: 25 }, // Puntos de Cocción
      { width: 25 }, // Acompañamientos
      { width: 20 }  // Máximo Acompañamientos
    ]
    
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

    // Hoja 6: Categorías de Referencia (para importación)
    const categoriesRef = data.categories.map(cat => ({ 'Categorías Disponibles': cat.name }))
    const categoriesRefSheet = XLSX.utils.json_to_sheet(categoriesRef)
    XLSX.utils.book_append_sheet(workbook, categoriesRefSheet, 'Categorías Disponibles')

    // Hoja 7: Instrucciones de Importación
    const instructions = [
      { 'Campo': 'Nombre', 'Descripción': 'Nombre del item del menú (requerido)', 'Ejemplo': 'Hamburguesa Clásica' },
      { 'Campo': 'Precio', 'Descripción': 'Precio de venta (requerido, número)', 'Ejemplo': '25000' },
      { 'Campo': 'Precio Base', 'Descripción': 'Precio base sin impuestos (opcional, número)', 'Ejemplo': '20000' },
      { 'Campo': 'Categoría', 'Descripción': 'Nombre de la categoría (requerido, debe existir)', 'Ejemplo': 'Platos Principales' },
      { 'Campo': 'Activo', 'Descripción': 'Sí/No - Si el item está activo', 'Ejemplo': 'Sí' },
      { 'Campo': 'Impuesto', 'Descripción': 'Porcentaje de impuesto (opcional)', 'Ejemplo': '0' },
      { 'Campo': 'Tarifa', 'Descripción': 'Tarifa adicional (opcional)', 'Ejemplo': '0' },
      { 'Campo': 'Autor', 'Descripción': 'Nombre del autor/chef (requerido)', 'Ejemplo': 'Chef Principal' },
      { 'Campo': 'Tiene Puntos de Cocción', 'Descripción': 'Sí/No - Si el item tiene puntos de cocción', 'Ejemplo': 'Sí' },
      { 'Campo': 'Tiene Acompañamientos', 'Descripción': 'Sí/No - Si el item tiene acompañamientos', 'Ejemplo': 'Sí' },
      { 'Campo': 'Máximo Acompañamientos', 'Descripción': 'Número máximo de acompañamientos permitidos (opcional, número)', 'Ejemplo': '3' }
    ]

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions)
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones')

    // Generar archivo y descargar
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    const fileName = `menu_completo_${new Date().toISOString().split('T')[0]}.xlsx`
    saveAs(blob, fileName)
  }

  // Generar plantilla para importación
  async downloadTemplate(categories: MenuCategory[]): Promise<void> {
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
        'Tiene Acompañamientos': 'Sí',
        'Máximo Acompañamientos': 2
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
      { width: 25 }, // Acompañamientos
      { width: 20 }  // Máximo Acompañamientos
    ]

    XLSX.utils.book_append_sheet(workbook, templateSheet, 'Plantilla Items')

    // Hoja de referencia: Categorías disponibles
    const categoriesRef = categories.map(cat => ({ 'Categorías Disponibles': cat.name }))
    const categoriesSheet = XLSX.utils.json_to_sheet(categoriesRef)
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Categorías')

    // Hoja de instrucciones
    const instructions = [
      { 'Campo': 'Nombre', 'Descripción': 'Nombre del item del menú (requerido)', 'Ejemplo': 'Hamburguesa Clásica' },
      { 'Campo': 'Precio', 'Descripción': 'Precio de venta (requerido, número)', 'Ejemplo': '25000' },
      { 'Campo': 'Precio Base', 'Descripción': 'Precio base sin impuestos (opcional, número)', 'Ejemplo': '20000' },
      { 'Campo': 'Categoría', 'Descripción': 'Nombre de la categoría (requerido, debe existir)', 'Ejemplo': 'Platos Principales' },
      { 'Campo': 'Activo', 'Descripción': 'Sí/No - Si el item está activo', 'Ejemplo': 'Sí' },
      { 'Campo': 'Impuesto', 'Descripción': 'Porcentaje de impuesto (opcional)', 'Ejemplo': '0' },
      { 'Campo': 'Tarifa', 'Descripción': 'Tarifa adicional (opcional)', 'Ejemplo': '0' },
      { 'Campo': 'Autor', 'Descripción': 'Nombre del autor/chef (requerido)', 'Ejemplo': 'Chef Principal' },
      { 'Campo': 'Tiene Puntos de Cocción', 'Descripción': 'Sí/No - Si el item tiene puntos de cocción', 'Ejemplo': 'Sí' },
      { 'Campo': 'Tiene Acompañamientos', 'Descripción': 'Sí/No - Si el item tiene acompañamientos', 'Ejemplo': 'Sí' },
      { 'Campo': 'Máximo Acompañamientos', 'Descripción': 'Número máximo de acompañamientos permitidos (opcional, número)', 'Ejemplo': '3' }
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
    _sides: Side[], 
    _cookingPoints: CookingPoint[],
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

          console.log('Datos del Excel:', jsonData) // Debug

          const errors: string[] = []
          const validItems: MenuItemFormData[] = []
          let processedRows = 0

          // Filtrar filas vacías o de ejemplo
          const filteredData = jsonData.filter(row => {
            const name = row['Nombre']?.toString().trim()
            return name && 
                   name !== '' && 
                   !name.toLowerCase().includes('ejemplo') &&
                   name !== 'Ejemplo: Hamburguesa Clásica'
          })

          console.log('Datos filtrados:', filteredData) // Debug

          if (filteredData.length === 0) {
            resolve({
              success: false,
              errors: ['No se encontraron filas válidas para importar. Asegúrate de que el archivo tenga datos y no solo ejemplos.'],
              totalRows: jsonData.length,
              validRows: 0
            })
            return
          }

          filteredData.forEach((row: ExcelRowData, index: number) => {
            processedRows++
            onProgress?.(Math.round((processedRows / filteredData.length) * 100))

            try {
              // Validar campos requeridos
              const name = row['Nombre']?.toString().trim()
              if (!name) {
                errors.push(`Fila ${index + 2}: Nombre es requerido`)
                return
              }

              // Validar longitud del nombre
              if (name.length > 100) {
                errors.push(`Fila ${index + 2}: Nombre no puede exceder 100 caracteres`)
                return
              }

              const priceValue = row['Precio']
              if (!priceValue || isNaN(Number(priceValue))) {
                errors.push(`Fila ${index + 2}: Precio debe ser un número válido (valor: ${priceValue})`)
                return
              }

              const price = Number(priceValue)
              if (price <= 0) {
                errors.push(`Fila ${index + 2}: Precio debe ser mayor a 0`)
                return
              }

              // Buscar categoría (requerida)
              const categoryName = row['Categoría']?.toString().trim()
              if (!categoryName) {
                errors.push(`Fila ${index + 2}: Categoría es requerida`)
                return
              }

              const category = categories.find(cat => 
                cat.name.toLowerCase() === categoryName.toLowerCase()
              )

              if (!category) {
                errors.push(`Fila ${index + 2}: Categoría "${categoryName}" no encontrada. Categorías disponibles: ${categories.map(c => c.name).join(', ')}`)
                return
              }

              // Validar autor (requerido)
              const author = row['Autor']?.toString().trim()
              if (!author) {
                errors.push(`Fila ${index + 2}: Autor es requerido`)
                return
              }

              // Procesar valores booleanos
              const parseBoolean = (value: any): boolean => {
                if (typeof value === 'boolean') return value
                const str = value?.toString().toLowerCase().trim()
                return str === 'sí' || str === 'si' || str === 'true' || str === '1'
              }

              // Validar y procesar precio base
              let basePrice = price
              if (row['Precio Base']) {
                const basePriceValue = Number(row['Precio Base'])
                if (isNaN(basePriceValue) || basePriceValue <= 0) {
                  errors.push(`Fila ${index + 2}: Precio Base debe ser un número válido mayor a 0`)
                  return
                }
                basePrice = basePriceValue
              }

              // Validar impuesto
              let tax = 0
              if (row['Impuesto']) {
                const taxValue = Number(row['Impuesto'])
                if (isNaN(taxValue) || taxValue < 0) {
                  errors.push(`Fila ${index + 2}: Impuesto debe ser un número válido mayor o igual a 0`)
                  return
                }
                tax = taxValue
              }

              // Validar tarifa
              let fee = 0
              if (row['Tarifa']) {
                const feeValue = Number(row['Tarifa'])
                if (isNaN(feeValue) || feeValue < 0) {
                  errors.push(`Fila ${index + 2}: Tarifa debe ser un número válido mayor o igual a 0`)
                  return
                }
                fee = feeValue
              }

              const hasSides = parseBoolean(row['Tiene Acompañamientos'])
              const hasCookingPoint = parseBoolean(row['Tiene Puntos de Cocción'])

              // Validar y procesar máximo de acompañamientos
              let maxSidesCount = 0
              if (hasSides) {
                if (row['Máximo Acompañamientos']) {
                  const maxSidesValue = Number(row['Máximo Acompañamientos'])
                  if (isNaN(maxSidesValue) || maxSidesValue < 0) {
                    errors.push(`Fila ${index + 2}: Máximo Acompañamientos debe ser un número válido mayor o igual a 0`)
                    return
                  }
                  maxSidesCount = maxSidesValue
                } else {
                  // Valor por defecto si tiene acompañamientos pero no se especifica máximo
                  maxSidesCount = 3
                }
              }

              // Crear item válido
              const item: MenuItemFormData = {
                name: name,
                price: price,
                base_price: basePrice,
                category_id: category.id,
                active: parseBoolean(row['Activo']),
                tax: tax,
                fee: fee,
                author: author,
                has_cooking_point: hasCookingPoint,
                has_sides: hasSides,
                max_sides_count: maxSidesCount
              }

              console.log('Item creado:', item) // Debug
              validItems.push(item)
            } catch (error) {
              console.error(`Error procesando fila ${index + 2}:`, error)
              errors.push(`Fila ${index + 2}: Error procesando datos - ${error}`)
            }
          })

          console.log('Items válidos:', validItems) // Debug
          console.log('Errores:', errors) // Debug

          resolve({
            success: validItems.length > 0,
            data: validItems,
            errors: errors.length > 0 ? errors : undefined,
            totalRows: filteredData.length,
            validRows: validItems.length
          })

        } catch (error) {
          console.error('Error leyendo archivo:', error)
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