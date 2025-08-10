import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type PaginationState,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/toast'
import MenuItemFormDialog from './MenuItemFormDialog'
import {
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
} from 'lucide-react'
import {
  useMenuItems,
  useMenuCategoriesForSelect,
  useDeleteMenuItem,
  useUpdateMenuItem,
} from '../hooks'
import type { MenuItem, MenuItemFilters } from '../types'

interface MenuItemsTableProps {
  className?: string
}

const columnHelper = createColumnHelper<MenuItem>()

const MenuItemsTable: React.FC<MenuItemsTableProps> = ({ className }) => {
  const isMobile = useIsMobile()
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedCookingPoint, setSelectedCookingPoint] = useState<string>('all')
  const [selectedSide, setSelectedSide] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<MenuItem | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('')

  const { addToast } = useToast()

  // Debounce the global filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter)
    }, 300)

    return () => clearTimeout(timer)
  }, [globalFilter])

  // Build filters object
  const filters: MenuItemFilters = useMemo(() => {
    const filterObj: MenuItemFilters = {}
    
    if (debouncedGlobalFilter) {
      filterObj.search = debouncedGlobalFilter
    }
    if (selectedStatus && selectedStatus !== 'all') {
      filterObj.active = selectedStatus === 'active'
    }
    if (selectedCategory && selectedCategory !== 'all') {
      filterObj.category_id = parseInt(selectedCategory)
    }
    if (selectedCookingPoint && selectedCookingPoint !== 'all') {
      filterObj.has_cooking_point = selectedCookingPoint === 'true'
    }
    if (selectedSide && selectedSide !== 'all') {
      filterObj.has_sides = selectedSide === 'true'
    }
    
    return filterObj
  }, [debouncedGlobalFilter, selectedStatus, selectedCategory, selectedCookingPoint, selectedSide])

  // Fetch data using hooks
  const { data: itemsData, isLoading: itemsLoading, error: itemsError } = useMenuItems(
    filters,
    pagination.pageIndex + 1,
    pagination.pageSize
  )

  const { data: categoriesOptions } = useMenuCategoriesForSelect()

  // Mutations
  const deleteItemMutation = useDeleteMenuItem()
  const updateItemMutation = useUpdateMenuItem()

  const handleDeleteItem = useCallback(async (item: MenuItem) => {
    try {
      await deleteItemMutation.mutateAsync(item.id)
      addToast({
          title: 'Éxito',
          description: 'Ítem eliminado correctamente',
          variant: 'success',
        })
        setDeleteDialogOpen(false)
        setItemToDelete(null)
      } catch (error) {
        addToast({
          title: 'Error',
          description: 'Error al eliminar el ítem',
          variant: 'error',
        })
      }
    }, [deleteItemMutation, addToast])

  const handleToggleActive = useCallback(async (item: MenuItem) => {
    try {
      await updateItemMutation.mutateAsync({
        id: item.id,
        data: { active: !item.active }
      })
      addToast({
        title: "Éxito",
        description: `Ítem ${item.active ? 'desactivado' : 'activado'} correctamente`,
        variant: "success"
      })
    } catch (error) {
      console.error('Error toggling item status:', error)
      addToast({
        title: "Error",
        description: "No se pudo cambiar el estado del ítem",
        variant: "error"
      })
    }
  }, [updateItemMutation, addToast])

  const handleEdit = useCallback((item: MenuItem) => {
    setItemToEdit(item)
    setEditDialogOpen(true)
  }, [])

  const handleToggleStatus = useCallback((item: MenuItem) => {
    handleToggleActive(item)
  }, [handleToggleActive])

  const handleDelete = useCallback((item: MenuItem) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price)
  }

  // Mobile Card Component
  const MobileCard = ({ 
    item, 
    onEdit, 
    onToggleStatus, 
    onDelete 
  }: { 
    item: MenuItem;
    onEdit: (item: MenuItem) => void;
    onToggleStatus: (item: MenuItem) => void;
    onDelete: (item: MenuItem) => void;
  }) => (
    <Card className="p-4 space-y-3">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-base truncate" title={item.name}>{item.name}</h3>
          <p className="text-lg font-semibold text-primary mt-1">
            {formatPrice(item.price || 0)}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onEdit(item)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
                onClick={() => onToggleStatus(item)}
              >
                {item.active ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Desactivar
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Activar
                  </>
                )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(item)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">
          <span className="truncate max-w-[200px]" title={item.menu_categories?.name || 'Sin categoría'}>
            {item.menu_categories?.name || 'Sin categoría'}
          </span>
        </Badge>
        <Badge variant={item.active ? 'default' : 'secondary'}>
          {item.active ? 'Activo' : 'Inactivo'}
        </Badge>
        {item.has_cooking_point && (
          <Badge variant="secondary">Punto de cocción</Badge>
        )}
        {item.has_sides && (
          <Badge variant="secondary">Acompañamientos</Badge>
        )}
      </div>
    </Card>
  )

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Nombre',
        cell: (info) => (
          <div className="font-medium">
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor('price', {
        header: 'Precio',
        cell: (info) => (
          <div className="font-medium">
            {formatPrice(info.getValue() || 0)}
          </div>
        ),
      }),
      columnHelper.accessor('menu_categories', {
        header: 'Categoría',
        cell: (info) => {
          const category = info.getValue()
          return (
            <Badge variant="outline">
              {category?.name || 'Sin categoría'}
            </Badge>
          )
        },
      }),
      columnHelper.accessor('has_cooking_point', {
         header: 'Punto de Cocción',
         cell: (info) => (
           <Badge variant={info.getValue() ? 'secondary' : 'outline'}>
             {info.getValue() ? 'Sí' : 'No'}
           </Badge>
         ),
       }),
       columnHelper.accessor('has_sides', {
         header: 'Acompañamientos',
         cell: (info) => (
           <Badge variant={info.getValue() ? 'secondary' : 'outline'}>
             {info.getValue() ? 'Sí' : 'No'}
           </Badge>
         ),
       }),
      columnHelper.accessor('active', {
        header: 'Estado',
        cell: (info) => (
          <Badge variant={info.getValue() ? 'default' : 'secondary'}>
            {info.getValue() ? 'Activo' : 'Inactivo'}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => {
          const item = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menú</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setItemToEdit(item)
                    setEditDialogOpen(true)
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleToggleActive(item)}
                >
                  {item.active ? (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" />
                      Desactivar
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Activar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setItemToDelete(item)
                    setDeleteDialogOpen(true)
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      }),
    ],
    [handleToggleActive, formatPrice]
  )

  const table = useReactTable({
    data: itemsData?.items || [],
    columns,
    pageCount: itemsData ? Math.ceil(itemsData.total / pagination.pageSize) : -1,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  })

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  )

  if (itemsLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Ítems del Menú</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton />
        </CardContent>
      </Card>
    )
  }

  if (itemsError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error al cargar los ítems del menú</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-bold">Gestión de Menú</h2>
          <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Ítem
          </Button>
        </div>

        <Card className={className}>
          <CardHeader>
            <CardTitle>Ítems del Menú</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="relative w-full">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar ítems..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="pl-8"
                    autoFocus
                  />
                </div>
                {!isMobile && (
                  <Button variant="outline" size="sm" className="whitespace-nowrap">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categoriesOptions?.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedCookingPoint} onValueChange={setSelectedCookingPoint}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Punto de cocción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Con punto de cocción</SelectItem>
                    <SelectItem value="false">Sin punto de cocción</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedSide} onValueChange={setSelectedSide}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Acompañamientos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Con acompañamientos</SelectItem>
                    <SelectItem value="false">Sin acompañamientos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content */}
            {isMobile ? (
              // Mobile Cards View
              <div className="space-y-4">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <MobileCard
                      key={row.id}
                      item={row.original}
                      onEdit={handleEdit}
                      onToggleStatus={handleToggleStatus}
                      onDelete={handleDelete}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron resultados.
                  </div>
                )}
              </div>
            ) : (
              // Desktop Table View
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="whitespace-nowrap">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          No se encontraron resultados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a{' '}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  itemsData?.total || 0
                )}{' '}
                de {itemsData?.total || 0} resultados
              </div>
              <div className="flex items-center space-x-2">
                {!isMobile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {isMobile && <span className="ml-1">Anterior</span>}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  {isMobile && <span className="mr-1">Siguiente</span>}
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {!isMobile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
       <AlertDialog
         open={deleteDialogOpen}
         onOpenChange={setDeleteDialogOpen}
         title="Confirmar eliminación"
         description={itemToDelete ? `¿Estás seguro de que quieres eliminar "${itemToDelete.name}"? Esta acción no se puede deshacer.` : ''}
         variant="destructive"
         confirmText="Eliminar"
         cancelText="Cancelar"
         onConfirm={() => itemToDelete ? handleDeleteItem(itemToDelete) : Promise.resolve()}
         onCancel={() => {
           setDeleteDialogOpen(false)
           setItemToDelete(null)
         }}
       />

       {/* Create Dialog */}
       <MenuItemFormDialog
         open={createDialogOpen}
         onClose={() => setCreateDialogOpen(false)}
       />

       {/* Edit Dialog */}
       {editDialogOpen && itemToEdit && (
         <MenuItemFormDialog
           open={editDialogOpen}
           onClose={() => {
             setEditDialogOpen(false)
             setItemToEdit(null)
           }}
           menuItem={itemToEdit}
         />
       )}
    </>
  )
}

export default MenuItemsTable