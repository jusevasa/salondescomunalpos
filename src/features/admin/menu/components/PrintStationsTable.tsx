import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/toast'
import { Plus, Wifi, WifiOff, Loader2 } from 'lucide-react'
import { usePrintStations, useDeletePrintStation, useUpdatePrintStation, useTestPrinterConnection } from '../hooks'
import type { PrintStationFilters, PrintStation } from '../types'
import PrintStationFormDialog from './PrintStationFormDialog'

export default function PrintStationsTable() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<PrintStationFilters>({
    search: '',
    active: undefined
  })
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [editingPrintStation, setEditingPrintStation] = useState<PrintStation | null>(null)
  const [testingPrinter, setTestingPrinter] = useState<number | null>(null)

  const { data: printStationsData, isLoading } = usePrintStations(filters, page, 10)
  const deletePrintStationMutation = useDeletePrintStation()
  const updatePrintStationMutation = useUpdatePrintStation()
  const testPrinterMutation = useTestPrinterConnection()
  const { addToast } = useToast()

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }))
    setPage(1)
  }

  const handleFilterChange = (key: keyof PrintStationFilters, value: boolean | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta estación de impresión?')) {
      try {
        await deletePrintStationMutation.mutateAsync(id)
        addToast({ title: 'Éxito', description: 'Estación eliminada', variant: 'success' })
      } catch (_) {
        addToast({ title: 'Error', description: 'No se pudo eliminar la estación', variant: 'error' })
      }
    }
  }

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await updatePrintStationMutation.mutateAsync({
        id,
        data: { active: !currentActive }
      })
      addToast({
        title: 'Éxito',
        description: `Estación ${currentActive ? 'desactivada' : 'activada'}`,
        variant: 'success'
      })
    } catch (_) {
      addToast({ title: 'Error', description: 'No se pudo cambiar el estado', variant: 'error' })
    }
  }

  const handleOpenCreateForm = () => {
    setEditingPrintStation(null)
    setShowFormDialog(true)
  }

  const handleOpenEditForm = (printStation: PrintStation) => {
    setEditingPrintStation(printStation)
    setShowFormDialog(true)
  }

  const handleCloseForm = () => {
    setShowFormDialog(false)
    setEditingPrintStation(null)
  }

  const handleTestConnection = async (station: PrintStation) => {
    if (!station.printer_ip) {
      addToast({
        title: 'IP no configurada',
        description: 'Esta estación no tiene una IP de impresora configurada',
        variant: 'warning'
      })
      return
    }

    setTestingPrinter(station.id)
    try {
      const result = await testPrinterMutation.mutateAsync(station.printer_ip)
      if (result.success) {
        addToast({
          title: 'Conexión exitosa',
          description: `Impresora ${station.printer_ip} conectada correctamente`,
          variant: 'success'
        })
      } else {
        addToast({
          title: 'Error de conexión',
          description: result.message,
          variant: 'error'
        })
      }
    } catch (error) {
      addToast({
        title: 'Error de conexión',
        description: 'No se pudo conectar con la impresora',
        variant: 'error'
      })
    } finally {
      setTestingPrinter(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Gestión de Estaciones de Impresión</CardTitle>
          <Button onClick={handleOpenCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Estación
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Buscar estaciones..."
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-sm"
          />
          
          <Select
            value={filters.active?.toString() || 'all'}
            onValueChange={(value) => handleFilterChange('active', value === 'all' ? undefined : value === 'true')}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Activos</SelectItem>
              <SelectItem value="false">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabla */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>IP de Impresora</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Conexión</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {printStationsData?.print_stations.map((station) => (
                <TableRow key={station.id}>
                  <TableCell className="font-medium">{station.name}</TableCell>
                  <TableCell>{station.code}</TableCell>
                  <TableCell>{station.printer_ip || 'No configurada'}</TableCell>
                  <TableCell>{station.display_order}</TableCell>
                  <TableCell>
                    <Badge variant={station.active ? 'default' : 'secondary'}>
                      {station.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(station)}
                      disabled={!station.printer_ip || testingPrinter === station.id}
                      className="flex items-center gap-1"
                    >
                      {testingPrinter === station.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : station.printer_ip ? (
                        <Wifi className="h-3 w-3" />
                      ) : (
                        <WifiOff className="h-3 w-3" />
                      )}
                      {testingPrinter === station.id ? 'Probando...' : 'Probar'}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditForm(station)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant={station.active ? 'secondary' : 'default'}
                        size="sm"
                        onClick={() => handleToggleActive(station.id, station.active)}
                      >
                        {station.active ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(station.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {printStationsData?.print_stations.length || 0} de {printStationsData?.total || 0} estaciones
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={!printStationsData || printStationsData.print_stations.length < 10}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </CardContent>

      <PrintStationFormDialog
        open={showFormDialog}
        onClose={handleCloseForm}
        printStation={editingPrintStation}
      />
    </Card>
  )
}