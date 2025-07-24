import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus } from 'lucide-react'
import { useSides, useDeleteSide, useUpdateSide } from '../hooks'
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
      await deleteSideMutation.mutateAsync(id)
    }
  }

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    await updateSideMutation.mutateAsync({
      id,
      data: { active: !currentActive }
    })
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

        {/* Tabla */}
        <div className="border rounded-lg">
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