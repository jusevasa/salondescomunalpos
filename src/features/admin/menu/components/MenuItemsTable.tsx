import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus } from 'lucide-react'
import { useMenuItems, useDeleteMenuItem, useUpdateMenuItem, useMenuCategories } from '../hooks'
import type { MenuItemFilters, MenuItem } from '../types'
import MenuItemFormDialog from './MenuItemFormDialog'

export default function MenuItemsTable() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<MenuItemFilters>({
    search: '',
    active: undefined,
    category_id: undefined,
    has_cooking_point: undefined,
    has_sides: undefined
  })
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }))
      setPage(1)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  const { data: itemsData, isLoading } = useMenuItems(filters, page, 10)
  const { data: categoriesData } = useMenuCategories({ active: true }, 1, 100)
  const deleteItemMutation = useDeleteMenuItem()
  const updateItemMutation = useUpdateMenuItem()

  const handleSearchInput = useCallback((search: string) => {
    setSearchInput(search)
  }, [])

  const handleFilterChange = useCallback((key: keyof MenuItemFilters, value: boolean | number | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }, [])

  const handleDelete = useCallback(async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este item?')) {
      await deleteItemMutation.mutateAsync(id)
    }
  }, [deleteItemMutation])

  const handleToggleActive = useCallback(async (id: number, currentActive: boolean) => {
    await updateItemMutation.mutateAsync({
      id,
      data: { active: !currentActive }
    })
  }, [updateItemMutation])

  const handleOpenCreateForm = useCallback(() => {
    setEditingItem(null)
    setShowFormDialog(true)
  }, [])

  const handleOpenEditForm = useCallback((item: MenuItem) => {
    setEditingItem(item)
    setShowFormDialog(true)
  }, [])

  const handleCloseForm = useCallback(() => {
    setShowFormDialog(false)
    setEditingItem(null)
  }, [])

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price)
  }, [])

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
          <CardTitle>Gestión de Items del Menú</CardTitle>
          <Button onClick={handleOpenCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Item
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Buscar items..."
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
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

          <Select
            value={filters.category_id?.toString() || 'all'}
            onValueChange={(value) => handleFilterChange('category_id', value === 'all' ? undefined : parseInt(value))}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categoriesData?.categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.has_cooking_point?.toString() || 'all'}
            onValueChange={(value) => handleFilterChange('has_cooking_point', value === 'all' ? undefined : value === 'true')}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Cocina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Con cocina</SelectItem>
              <SelectItem value="false">Sin cocina</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.has_sides?.toString() || 'all'}
            onValueChange={(value) => handleFilterChange('has_sides', value === 'all' ? undefined : value === 'true')}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Acompañamientos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Con acompañamientos</SelectItem>
              <SelectItem value="false">Sin acompañamientos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabla */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Cocina</TableHead>
                <TableHead>Acompañamientos</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsData?.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category?.name}</TableCell>
                  <TableCell>{formatPrice(item.price)}</TableCell>
                  <TableCell>
                    <Badge variant={item.active ? 'default' : 'secondary'}>
                      {item.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.has_cooking_point ? 'default' : 'outline'}>
                      {item.has_cooking_point ? 'Sí' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.has_sides && item.item_sides && item.item_sides.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          {item.item_sides.length} disponibles (máx: {item.max_sides_count})
                        </Badge>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.item_sides.map((itemSide) => (
                            <Badge key={itemSide.side_id} variant="secondary" className="text-xs">
                              {itemSide.side?.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline">No</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditForm(item)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant={item.active ? 'secondary' : 'default'}
                        size="sm"
                        onClick={() => handleToggleActive(item.id, item.active)}
                      >
                        {item.active ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
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
            Mostrando {itemsData?.items.length || 0} de {itemsData?.total || 0} items
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
              disabled={!itemsData || itemsData.items.length < 10}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </CardContent>

      <MenuItemFormDialog
        open={showFormDialog}
        onClose={handleCloseForm}
        menuItem={editingItem}
      />
    </Card>
  )
}