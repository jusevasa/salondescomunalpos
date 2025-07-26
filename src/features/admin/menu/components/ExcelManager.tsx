import React, { useState, useEffect } from 'react'
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { excelService, type ExcelImportResult } from '../services/excelService'
import { 
  menuItemsService,
  menuCategoriesService,
  sidesService,
  cookingPointsService,
  printStationsService,
} from '../services'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'

interface ExcelManagerProps {
  onClose: () => void
}

export default function ExcelManager({ onClose }: ExcelManagerProps) {
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currentStep, setCurrentStep] = useState<string>('')
  
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  // Prevenir cierre durante operaciones críticas
  const canClose = !isImporting && !isExporting

  // Prevenir cierre de ventana durante importación
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isImporting || isExporting) {
        e.preventDefault()
        e.returnValue = 'Hay una operación en progreso. ¿Estás seguro de que quieres salir?'
        return e.returnValue
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !canClose) {
        e.preventDefault()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isImporting, isExporting, canClose])
 
  // Queries para obtener datos necesarios con relaciones completas
  const { data: menuItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['menu-items-export'],
    queryFn: async () => {
      try {
        const response = await menuItemsService.getItems({}, 1, 1000) // Obtener más items para exportación
        return response.items || []
      } catch (error) {
        console.error('Error loading menu items:', error)
        return []
      }
    }
  })

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories-export'],
    queryFn: async () => {
      try {
        const response = await menuCategoriesService.getCategories({}, 1, 1000)
        return response.categories || []
      } catch (error) {
        console.error('Error loading categories:', error)
        return []
      }
    }
  })

  const { data: sides = [], isLoading: loadingSides } = useQuery({
    queryKey: ['sides-export'],
    queryFn: async () => {
      try {
        const response = await sidesService.getSides({}, 1, 1000)
        return response.sides || []
      } catch (error) {
        console.error('Error loading sides:', error)
        return []
      }
    }
  })

  const { data: cookingPoints = [], isLoading: loadingCookingPoints } = useQuery({
    queryKey: ['cooking-points-export'],
    queryFn: async () => {
      try {
        const response = await cookingPointsService.getCookingPoints({}, 1, 1000)
        return response.cooking_points || []
      } catch (error) {
        console.error('Error loading cooking points:', error)
        return []
      }
    }
  })

  const { data: printStations = [], isLoading: loadingPrintStations } = useQuery({
    queryKey: ['print-stations-export'],
    queryFn: async () => {
      try {
        const response = await printStationsService.getPrintStations({}, 1, 1000)
        return response.print_stations || []
      } catch (error) {
        console.error('Error loading print stations:', error)
        return []
      }
    }
  })

  const isLoading = loadingItems || loadingCategories || loadingSides || loadingCookingPoints || loadingPrintStations

  // Mutation para crear/actualizar items importados
  const upsertItemMutation = useMutation({
    mutationFn: menuItemsService.upsertItem,
    onSuccess: () => {
      // Invalidar múltiples queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['menu-items'] })
      queryClient.invalidateQueries({ queryKey: ['menu-items-export'] })
      queryClient.invalidateQueries({ queryKey: ['menu-stats'] })
    }
  })

  const handleExportMenu = async () => {
    if (isExporting) return
    
    setIsExporting(true)
    setCurrentStep('Preparando datos para exportación...')
    
    try {
      // Transformar los datos al formato esperado por ExcelService
      const exportData = {
        menuItems: menuItems, // Usar los datos de las queries que ya tienen las relaciones
        categories,
        sides,
        cookingPoints,
        printStations
      }
      
      setCurrentStep('Generando archivo Excel...')
      
      // Crear el archivo Excel con los datos completos
      await excelService.exportMenu(exportData)
      
      setCurrentStep('¡Exportación completada!')
      
      // Limpiar estado después de un tiempo
      setTimeout(() => {
        setCurrentStep('')
        setIsExporting(false)
      }, 2000)
      
    } catch (error) {
      console.error('Error exporting menu:', error)
      setCurrentStep('Error en la exportación')
      
      setTimeout(() => {
        setCurrentStep('')
        setIsExporting(false)
      }, 3000)
    }
  }

  const handleDownloadTemplate = async () => {
    if (isExporting) return
    
    setIsExporting(true)
    setCurrentStep('Generando plantilla...')
    
    try {
      await excelService.downloadTemplate(categories)
      setCurrentStep('Plantilla descargada exitosamente')
      setTimeout(() => {
        setCurrentStep('')
        setIsExporting(false)
      }, 1500)
    } catch (error) {
      console.error('Error descargando plantilla:', error)
      setCurrentStep('')
      setIsExporting(false)
      addToast({
        title: 'Error al descargar plantilla',
        description: 'Hubo un problema al descargar la plantilla. Por favor, intenta de nuevo.',
        variant: 'error'
      })
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
    if (!selectedFile || isImporting) return

    setIsImporting(true)
    setImportProgress(0)
    setImportResult(null)
    setCurrentStep('Analizando archivo Excel...')

    try {
      const result = await excelService.importMenuItems(
        selectedFile,
        categories,
        sides,
        cookingPoints,
        (progress: number) => {
          setImportProgress(progress)
          if (progress < 50) {
            setCurrentStep('Validando datos del archivo...')
          } else if (progress < 80) {
            setCurrentStep('Procesando items del menú...')
          } else {
            setCurrentStep('Finalizando importación...')
          }
        }
      )

      setImportResult(result)
      setCurrentStep('Creando items en la base de datos...')

      // Si la importación fue exitosa, crear/actualizar los items
      if (result.success && result.data && result.data.length > 0) {
        let successCount = 0
        let errorCount = 0
        const errors: string[] = []

        for (let i = 0; i < result.data.length; i++) {
          const item = result.data[i]
          try {
            // Validación adicional antes de enviar a Supabase
            if (!item.name || item.name.trim().length === 0) {
              throw new Error('Nombre es requerido')
            }
            
            if (!item.price || item.price <= 0) {
              throw new Error('Precio debe ser mayor a 0')
            }
            
            if (!item.category_id) {
              throw new Error('Categoría es requerida')
            }
            
            if (!item.author || item.author.trim().length === 0) {
              throw new Error('Autor es requerido')
            }

            console.log(`Procesando item ${i + 1}/${result.data.length}:`, item)
            
            await upsertItemMutation.mutateAsync(item)
            successCount++
            
            console.log(`✅ Item "${item.name}" procesado exitosamente`)
            
            // Actualizar progreso de creación
            const creationProgress = Math.round(((i + 1) / result.data.length) * 100)
            setImportProgress(creationProgress)
            setCurrentStep(`Creando item ${i + 1} de ${result.data.length}: ${item.name}`)
          } catch (error) {
            errorCount++
            const errorMessage = error instanceof Error ? error.message : String(error)
            const detailedError = `Error procesando "${item.name}": ${errorMessage}`
            errors.push(detailedError)
            console.error('❌ Error procesando item:', {
              item,
              error: errorMessage,
              fullError: error
            })
          }
        }

        // Invalidar todas las queries relacionadas al final
        setCurrentStep('Actualizando datos...')
        await queryClient.invalidateQueries({ queryKey: ['menu-items'] })
        await queryClient.invalidateQueries({ queryKey: ['menu-items-simple'] })
        await queryClient.invalidateQueries({ queryKey: ['menu-stats'] })
        await queryClient.invalidateQueries({ queryKey: ['categories-simple'] })

        // Actualizar el resultado con información de creación
        setImportResult({
          ...result,
          success: successCount > 0,
          errors: errors.length > 0 ? [...(result.errors || []), ...errors] : result.errors,
          validRows: successCount,
          totalRows: result.totalRows
        })

        setCurrentStep('Importación completada')

        // Mostrar mensaje de éxito
        if (successCount > 0) {
          addToast({
            title: 'Importación completada',
            description: `${successCount} items procesados exitosamente (creados/actualizados)${errorCount > 0 ? `, ${errorCount} errores` : ''}`,
            variant: 'success'
          })
        }
      } else {
        setCurrentStep('Error: No se encontraron items válidos')
        addToast({
          title: 'Sin items válidos',
          description: 'No se encontraron items válidos para importar en el archivo',
          variant: 'error'
        })
      }
    } catch (error) {
      console.error('Error en importación:', error)
      setImportResult({
        success: false,
        errors: [`Error procesando archivo: ${error}`],
        totalRows: 0,
        validRows: 0
      })
      setCurrentStep('Error en la importación')
      addToast({
        title: 'Error procesando archivo',
        description: 'Hubo un problema al procesar el archivo. Verifica el formato y vuelve a intentar.',
        variant: 'error'
      })
    } finally {
      setIsImporting(false)
      setImportProgress(0)
      setTimeout(() => setCurrentStep(''), 2000)
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
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando datos
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Preparando gestión de Excel...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={canClose ? onClose : undefined}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Gestión de Excel
          </DialogTitle>
          {!canClose && (
            <Alert className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Operación en progreso. No cierres esta ventana hasta que termine.
              </AlertDescription>
            </Alert>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Indicador de progreso global */}
          {(isImporting || isExporting) && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm font-medium">
                      {isImporting ? 'Importando datos...' : 'Exportando datos...'}
                    </span>
                  </div>
                  {currentStep && (
                    <p className="text-xs text-muted-foreground">{currentStep}</p>
                  )}
                  {isImporting && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progreso</span>
                        <span>{importProgress}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${importProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sección de Exportación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-4 w-4 text-blue-600" />
                Exportar Datos
              </CardTitle>
              <CardDescription>
                Descarga el menú completo o una plantilla para importación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleExportMenu}
                disabled={isExporting || isImporting}
                className="w-full"
                variant="default"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                )}
                Descargar Menú Completo
                <Badge variant="secondary" className="ml-2">
                  {menuItems.length} items
                </Badge>
              </Button>
              
              <Button
                onClick={handleDownloadTemplate}
                disabled={isExporting || isImporting}
                className="w-full"
                variant="outline"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Descargar Plantilla de Importación
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Sección de Importación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-orange-600" />
                Importar Items del Menú
              </CardTitle>
              <CardDescription>
                Sube un archivo Excel con los items del menú para importar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedFile && !importResult && (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="excel-file"
                    disabled={isImporting || isExporting}
                  />
                  <label
                    htmlFor="excel-file"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Seleccionar archivo Excel</p>
                      <p className="text-xs text-muted-foreground">
                        Formatos soportados: .xlsx, .xls
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {selectedFile && !importResult && (
                <div className="space-y-4">
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{selectedFile.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetImport}
                          disabled={isImporting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Button
                    onClick={handleImport}
                    disabled={isImporting || isExporting}
                    className="w-full"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Importar Archivo
                      </>
                    )}
                  </Button>
                </div>
              )}

              {importResult && (
                <div className="space-y-4">
                  <Alert className={importResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    {importResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">
                          {importResult.success ? 'Importación Exitosa' : 'Errores en la Importación'}
                        </p>
                        <div className="text-sm space-y-1">
                          <p>Total de filas procesadas: <Badge variant="outline">{importResult.totalRows}</Badge></p>
                          <p>Filas válidas: <Badge variant="outline">{importResult.validRows}</Badge></p>
                          {importResult.errors && importResult.errors.length > 0 && (
                            <p>Errores encontrados: <Badge variant="destructive">{importResult.errors.length}</Badge></p>
                          )}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <Card className="border-red-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-red-800">Errores Encontrados</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {importResult.errors.map((error, index) => (
                            <p key={index} className="text-xs text-red-700 bg-red-50 p-2 rounded">
                              {error}
                            </p>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    onClick={resetImport}
                    variant="outline"
                    className="w-full"
                    disabled={isImporting || isExporting}
                  >
                    Importar Otro Archivo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}