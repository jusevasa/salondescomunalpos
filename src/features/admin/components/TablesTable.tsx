'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Plus, Search, Users } from 'lucide-react'
import { useTables, useTablesSubscription } from '../hooks'
import { TableFormDialog } from './TableFormDialog'
import type { Table as TableType, TableFilters } from '../types'

export function TablesTable() {
  const [filters, setFilters] = useState<TableFilters>({})
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<TableType | null>(null)

  const { data: tablesResponse, isLoading, error } = useTables(filters)
  
  // Set up real-time subscription
  useTablesSubscription()

  const handleFilterChange = (key: keyof TableFilters, value: string | boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleEdit = (table: TableType) => {
    setEditingTable(table)
  }

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false)
    setEditingTable(null)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error al cargar las mesas</p>
          <p className="text-sm text-gray-500">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administración de Mesas</h1>
          <p className="text-muted-foreground">
            Gestiona las mesas del restaurante
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Mesa
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número de mesa..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="active-filter"
            checked={filters.active ?? true}
            onCheckedChange={(checked) => handleFilterChange('active', !!checked)}
          />
          <Label htmlFor="active-filter">Solo activas</Label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Mesas</p>
              <p className="text-2xl font-bold">{tablesResponse?.total || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Mesas Activas</p>
              <p className="text-2xl font-bold">
                {tablesResponse?.tables.filter(t => t.active).length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Capacidad Total</p>
              <p className="text-2xl font-bold">
                {tablesResponse?.tables
                  .filter(t => t.active)
                  .reduce((sum, t) => sum + t.capacity, 0) || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Capacidad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Disponibilidad</TableHead>
              <TableHead>Creada</TableHead>
              <TableHead>Actualizada</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Cargando mesas...
                </TableCell>
              </TableRow>
            ) : tablesResponse?.tables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No se encontraron mesas
                </TableCell>
              </TableRow>
            ) : (
              tablesResponse?.tables.map((table) => (
                <TableRow key={table.id}>
                  <TableCell className="font-medium">
                    Mesa {table.number}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-gray-500" />
                      {table.capacity} personas
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={table.active ? 'default' : 'secondary'}>
                      {table.active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={table.status ? 'default' : 'secondary'}>
                      {table.status ? 'Disponible' : 'Ocupada'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(table.created_at).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>
                    {new Date(table.updated_at).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(table)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleEdit(table)}
                          className="text-red-600"
                        >
                          {table.active ? 'Desactivar' : 'Activar'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <TableFormDialog
        open={isCreateDialogOpen || !!editingTable}
        onClose={handleCloseDialog}
        table={editingTable}
      />
    </div>
  )
}