import React, { useState } from 'react'
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { excelService, type ExcelImportResult } from '../services/excelService'
import { 
  menuItemsService,
  menuCategoriesService,
  sidesService,
  cookingPointsService,
  printStationsService
} from '../services'

interface ExcelManagerProps {
  onClose: () => void
}

export default function ExcelManager({ onClose }: ExcelManagerProps) {
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const queryClient = useQueryClient()
 
  // Queries para obtener datos necesarios - simplificadas para evitar errores
  const { data: menuItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['menu-items-simple'],
    queryFn: async () => {
      try {
        const response = await menuItemsService.getItems({}, 1, 100)
        return response.items || []
      } catch (error) {
        console.error('Error loading menu items:', error)
        return []
      }
    }
  })

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories-simple'],
    queryFn: async () => {
      try {
        const response = await menuCategoriesService.getCategories({}, 1, 100)
        return response.categories || []
      } catch (error) {
        console.error('Error loading categories:', error)
        return []
      }
    }
  })

  const { data: sides = [], isLoading: loadingSides } = useQuery({
    queryKey: ['sides-simple'],
    queryFn: async () => {
      try {
        const response = await sidesService.getSides({}, 1, 100)
        return response.sides || []
      } catch (error) {
        console.error('Error loading sides:', error)
        return []
      }
    }
  })

  const { data: cookingPoints = [], isLoading: loadingCookingPoints } = useQuery({
    queryKey: ['cooking-points-simple'],
    queryFn: async () => {
      try {
        const response = await cookingPointsService.getCookingPoints({}, 1, 100)
        return response.cooking_points || []
      } catch (error) {
        console.error('Error loading cooking points:', error)
        return []
      }
    }
  })

  const { data: printStations = [], isLoading: loadingPrintStations } = useQuery({
    queryKey: ['print-stations-simple'],
    queryFn: async () => {
      try {
        const response = await printStationsService.getPrintStations({}, 1, 100)
        return response.print_stations || []
      } catch (error) {
        console.error('Error loading print stations:', error)
        return []
      }
    }
  })

  const isLoading = loadingItems || loadingCategories || loadingSides || loadingCookingPoints || loadingPrintStations

  // Mutation para crear items importados
  const createItemMutation = useMutation({
    mutationFn: menuItemsService.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] })
    }
  })

  const handleExportMenu = async () => {
    try {
      await excelService.exportMenu({
        menuItems,
        categories,
        sides,
        cookingPoints,
        printStations
      })
    } catch (error) {
      console.error('Error exportando menú:', error)
      alert('Error al exportar el menú. Por favor, intenta de nuevo.')
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      await excelService.downloadTemplate(categories, sides, cookingPoints)
    } catch (error) {
      console.error('Error descargando plantilla:', error)
      alert('Error al descargar la plantilla. Por favor, intenta de nuevo.')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportResult(null)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setIsImporting(true)
    setImportProgress(0)
    setImportResult(null)

    try {
      const result = await excelService.importMenuItems(
        selectedFile,
        categories,
        sides,
        cookingPoints,
        (progress: number) => setImportProgress(progress)
      )

      setImportResult(result)

      // Si la importación fue exitosa, crear los items
      if (result.success && result.data) {
        for (const item of result.data) {
          try {
            await createItemMutation.mutateAsync(item)
          } catch (error) {
            console.error('Error creando item:', error)
          }
        }
      }
    } catch (error) {
      setImportResult({
        success: false,
        errors: [`Error procesando archivo: ${error}`],
        totalRows: 0,
        validRows: 0
      })
    } finally {
      setIsImporting(false)
      setImportProgress(0)
    }
  }

  const resetImport = () => {
    setSelectedFile(null)
    setImportResult(null)
    setImportProgress(0)
    setIsImporting(false)
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Cargando datos...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Gestión de Excel
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Sección de Exportación */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Download className="w-5 h-5 mr-2 text-blue-600" />
              Exportar Datos
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={handleExportMenu}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Descargar Menú Completo ({menuItems.length} items)
              </button>
              
              <button
                onClick={handleDownloadTemplate}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar Plantilla de Importación
              </button>
            </div>
          </div>

          {/* Sección de Importación */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Upload className="w-5 h-5 mr-2 text-orange-600" />
              Importar Items del Menú
            </h3>

            {!selectedFile && !importResult && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="excel-file"
                  />
                  <label
                    htmlFor="excel-file"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <FileSpreadsheet className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      Haz clic para seleccionar un archivo Excel
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Formatos soportados: .xlsx, .xls
                    </span>
                  </label>
                </div>
              </div>
            )}

            {selectedFile && !importResult && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span className="text-sm text-gray-700">{selectedFile.name}</span>
                  <button
                    onClick={resetImport}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Procesando archivo...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Importar Archivo
                    </>
                  )}
                </button>
              </div>
            )}

            {importResult && (
              <div className="space-y-4">
                <div className={`p-4 rounded-md ${
                  importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center mb-2">
                    {importResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    )}
                    <h4 className={`font-medium ${
                      importResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {importResult.success ? 'Importación Exitosa' : 'Errores en la Importación'}
                    </h4>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <p>Total de filas procesadas: {importResult.totalRows}</p>
                    <p>Filas válidas: {importResult.validRows}</p>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <p>Errores encontrados: {importResult.errors.length}</p>
                    )}
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-3 max-h-32 overflow-y-auto">
                      <h5 className="font-medium text-red-800 mb-1">Errores:</h5>
                      <ul className="text-sm text-red-700 space-y-1">
                        {importResult.errors.map((error, index) => (
                          <li key={index} className="list-disc list-inside">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <button
                  onClick={resetImport}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Importar Otro Archivo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}