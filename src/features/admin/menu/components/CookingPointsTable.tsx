import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus } from 'lucide-react'
import { useCookingPoints, useDeleteCookingPoint, useUpdateCookingPoint } from '../hooks'
import { useToast } from '@/components/ui/toast'
import type { CookingPointFilters, CookingPoint } from '../types'
import CookingPointFormDialog from './CookingPointFormDialog'

export default function CookingPointsTable() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<CookingPointFilters>({
    search: '',
    active: undefined
  })
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [editingCookingPoint, setEditingCookingPoint] = useState<CookingPoint | null>(null)

  const { data: cookingPointsData, isLoading } = useCookingPoints(filters, page, 10)
  const deleteCookingPointMutation = useDeleteCookingPoint()
  const updateCookingPointMutation = useUpdateCookingPoint()
  const { addToast } = useToast()

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }))
    setPage(1)
  }

  const handleFilterChange = (key: keyof CookingPointFilters, value: boolean | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este punto de cocción?')) {
      try {
        await deleteCookingPointMutation.mutateAsync(id)
        addToast({ title: 'Éxito', description: 'Punto de cocción eliminado', variant: 'success' })
      } catch (_) {
        addToast({ title: 'Error', description: 'No se pudo eliminar', variant: 'error' })
      }
    }
  }

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await updateCookingPointMutation.mutateAsync({
        id,
        data: { active: !currentActive }
      })
      addToast({
        title: 'Éxito',
        description: `Punto de cocción ${currentActive ? 'desactivado' : 'activado'}`,
        variant: 'success'
      })
    } catch (_) {
      addToast({ title: 'Error', description: 'No se pudo cambiar el estado', variant: 'error' })
    }
  }

  const handleOpenCreateForm = () => {
    setEditingCookingPoint(null)
    setShowFormDialog(true)
  }

  const handleOpenEditForm = (cookingPoint: CookingPoint) => {
    setEditingCookingPoint(cookingPoint)
    setShowFormDialog(true)
  }

  const handleCloseForm = () => {
    setShowFormDialog(false)
    setEditingCookingPoint(null)
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
          <CardTitle>Gestión de Puntos de Cocción</CardTitle>
          <Button onClick={handleOpenCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Punto de Cocción
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Buscar puntos de cocción..."
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
          {cookingPointsData?.cooking_points.map((cookingPoint) => (
            <div key={cookingPoint.id} className="p-4 border rounded-lg bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{cookingPoint.name}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={cookingPoint.active ? 'default' : 'secondary'}>
                      {cookingPoint.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Badge variant="outline">Orden: {cookingPoint.display_order}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {new Date(cookingPoint.created_at).toLocaleDateString('es-CO')}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEditForm(cookingPoint)} className="h-9">Editar</Button>
                  <Button
                    variant={cookingPoint.active ? 'secondary' : 'default'}
                    size="sm"
                    onClick={() => handleToggleActive(cookingPoint.id, cookingPoint.active)}
                    className="h-9"
                  >
                    {cookingPoint.active ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(cookingPoint.id)} className="h-9">Eliminar</Button>
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
              {cookingPointsData?.cooking_points.map((cookingPoint) => (
                <TableRow key={cookingPoint.id}>
                  <TableCell className="font-medium">{cookingPoint.name}</TableCell>
                  <TableCell>{cookingPoint.display_order}</TableCell>
                  <TableCell>
                    <Badge variant={cookingPoint.active ? 'default' : 'secondary'}>
                      {cookingPoint.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(cookingPoint.created_at).toLocaleDateString('es-CO')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditForm(cookingPoint)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant={cookingPoint.active ? 'secondary' : 'default'}
                        size="sm"
                        onClick={() => handleToggleActive(cookingPoint.id, cookingPoint.active)}
                      >
                        {cookingPoint.active ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(cookingPoint.id)}
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
            Mostrando {cookingPointsData?.cooking_points.length || 0} de {cookingPointsData?.total || 0} puntos de cocción
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
              disabled={!cookingPointsData || cookingPointsData.cooking_points.length < 10}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </CardContent>

      <CookingPointFormDialog
        open={showFormDialog}
        onClose={handleCloseForm}
        cookingPoint={editingCookingPoint}
      />
    </Card>
  )
}