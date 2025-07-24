import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff 
} from 'lucide-react'
import { 
  useMenuCategories, 
  useUpdateMenuCategory, 
  useDeleteMenuCategory 
} from '../hooks'
import { 
  menuCategoryFiltersSchema, 
  validateFilters
} from '../validations'
import type { MenuCategoryFilters, MenuCategory } from '../types'
import CategoryFormDialog from './CategoryFormDialog'

export default function MenuCategoriesTable() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<MenuCategoryFilters>({})
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | undefined>(undefined)
  const [filterError, setFilterError] = useState<string | null>(null)

  // Validate filters whenever they change
  useEffect(() => {
    try {
      validateFilters(menuCategoryFiltersSchema, {
        ...filters,
        search: search.trim() || undefined
      })
      setFilterError(null)
    } catch (error) {
      setFilterError(error instanceof Error ? error.message : 'Error en filtros')
    }
  }, [filters, search])

  const { 
    data: categoriesData, 
    isLoading 
  } = useMenuCategories(
    { 
      search: search.trim() || undefined,
      ...filters 
    },
    page,
    10
  )

  const updateMutation = useUpdateMenuCategory()
  const deleteMutation = useDeleteMenuCategory()

  const handleEdit = (categoryId: number) => {
    const category = categoriesData?.categories.find(c => c.id === categoryId)
    setEditingCategory(category)
    setShowFormDialog(true)
  }

  const handleDelete = async (categoryId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      await deleteMutation.mutateAsync(categoryId)
    }
  }

  const handleToggleActive = async (categoryId: number, currentStatus: boolean) => {
    await updateMutation.mutateAsync({
      id: categoryId,
      data: { active: !currentStatus }
    })
  }

  const handleCreateNew = () => {
    setEditingCategory(undefined)
    setShowFormDialog(true)
  }

  const handleCloseForm = () => {
    setShowFormDialog(false)
    setEditingCategory(undefined)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Categorías del Menú</CardTitle>
              <CardDescription>
                Gestiona las categorías de tu menú
              </CardDescription>
            </div>
            <Button onClick={handleCreateNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Categoría
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar categorías..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={filters.active === true ? "default" : "outline"}
              onClick={() => setFilters(prev => ({ 
                ...prev, 
                active: prev.active === true ? undefined : true 
              }))}
            >
              Activas
            </Button>
            <Button
              variant={filters.active === false ? "default" : "outline"}
              onClick={() => setFilters(prev => ({ 
                ...prev, 
                active: prev.active === false ? undefined : false 
              }))}
            >
              Inactivas
            </Button>
          </div>

          {/* Filter Error */}
          {filterError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{filterError}</p>
            </div>
          )}

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Cargando categorías...
                    </TableCell>
                  </TableRow>
                ) : categoriesData?.categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No se encontraron categorías
                    </TableCell>
                  </TableRow>
                ) : (
                  categoriesData?.categories.map((category: MenuCategory) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {category.description || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={category.active ? "default" : "secondary"}
                        >
                          {category.active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {category.display_order}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {category.menu_items?.length || 0} items
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(category.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(category.id, category.active)}
                            className="h-8 w-8 p-0"
                          >
                            {category.active ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(category.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {categoriesData && Math.ceil(categoriesData.total / 10) > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {((page - 1) * 10) + 1} a {Math.min(page * 10, categoriesData.total)} de {categoriesData.total} categorías
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, Math.ceil(categoriesData.total / 10)) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === Math.ceil(categoriesData.total / 10)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Form Dialog */}
      <CategoryFormDialog
        open={showFormDialog}
        onClose={handleCloseForm}
        category={editingCategory}
      />
    </div>
  )
}