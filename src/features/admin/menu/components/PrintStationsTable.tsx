import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus } from 'lucide-react'
import { usePrintStations, useDeletePrintStation, useUpdatePrintStation } from '../hooks'
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

  const { data: printStationsData, isLoading } = usePrintStations(filters, page, 10)
  const deletePrintStationMutation = useDeletePrintStation()
  const updatePrintStationMutation = useUpdatePrintStation()

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
      await deletePrintStationMutation.mutateAsync(id)
    }
  }

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    await updatePrintStationMutation.mutateAsync({
      id,
      data: { active: !currentActive }
    })
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