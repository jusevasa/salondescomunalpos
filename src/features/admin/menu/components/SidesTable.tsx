import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus } from 'lucide-react'
import { useSides, useDeleteSide, useUpdateSide } from '../hooks'
import { useToast } from '@/components/ui/toast'
import type { SideFilters, Side } from '../types'
import SideFormDialog from './SideFormDialog'

export default function SidesTable() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<SideFilters>({
    search: '',
    active: undefined
  })
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [editingSide, setEditingSide] = useState<Side | null>(null)

  const { data: sidesData, isLoading } = useSides(filters, page, 10)
  const deleteSideMutation = useDeleteSide()
  const updateSideMutation = useUpdateSide()
  const { addToast } = useToast()

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }))
    setPage(1)
  }

  const handleFilterChange = (key: keyof SideFilters, value: boolean | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este acompañamiento?')) {
      try {
        await deleteSideMutation.mutateAsync(id)
        addToast({ title: 'Éxito', description: 'Acompañamiento eliminado', variant: 'success' })
      } catch (_) {
        addToast({ title: 'Error', description: 'No se pudo eliminar', variant: 'error' })
      }
    }
  }

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await updateSideMutation.mutateAsync({
        id,
        data: { active: !currentActive }
      })
      addToast({
        title: 'Éxito',
        description: `Acompañamiento ${currentActive ? 'desactivado' : 'activado'}`,
        variant: 'success'
      })
    } catch (_) {
      addToast({ title: 'Error', description: 'No se pudo cambiar el estado', variant: 'error' })
    }
  }

  const handleOpenCreateForm = () => {
    setEditingSide(null)
    setShowFormDialog(true)
  }

  const handleOpenEditForm = (side: Side) => {
    setEditingSide(side)
    setShowFormDialog(true)
  }

  const handleCloseForm = () => {
    setShowFormDialog(false)
    setEditingSide(null)
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
          <CardTitle>Gestión de Acompañamientos</CardTitle>
          <Button onClick={handleOpenCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Acompañamiento
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Buscar acompañamientos..."
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

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {sidesData?.sides.map((side) => (
            <div key={side.id} className="p-4 border rounded-lg bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{side.name}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={side.active ? 'default' : 'secondary'}>
                      {side.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Badge variant="outline">Orden: {side.display_order}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {new Date(side.created_at).toLocaleDateString('es-CO')}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEditForm(side)} className="h-9">Editar</Button>
                  <Button
                    variant={side.active ? 'secondary' : 'default'}
                    size="sm"
                    onClick={() => handleToggleActive(side.id, side.active)}
                    className="h-9"
                  >
                    {side.active ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(side.id)} className="h-9">Eliminar</Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="hidden lg:block border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sidesData?.sides.map((side) => (
                <TableRow key={side.id}>
                  <TableCell className="font-medium">{side.name}</TableCell>
                  <TableCell>{side.display_order}</TableCell>
                  <TableCell>
                    <Badge variant={side.active ? 'default' : 'secondary'}>
                      {side.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(side.created_at).toLocaleDateString('es-CO')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditForm(side)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant={side.active ? 'secondary' : 'default'}
                        size="sm"
                        onClick={() => handleToggleActive(side.id, side.active)}
                      >
                        {side.active ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(side.id)}
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
            Mostrando {sidesData?.sides.length || 0} de {sidesData?.total || 0} acompañamientos
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
              disabled={!sidesData || sidesData.sides.length < 10}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </CardContent>

      <SideFormDialog
        open={showFormDialog}
        onClose={handleCloseForm}
        side={editingSide}
      />
    </Card>
  )
}