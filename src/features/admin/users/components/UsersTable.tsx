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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MoreHorizontal, Search, UserPlus, Edit, ToggleLeft, ToggleRight } from 'lucide-react'
import { useUsers, useToggleUserStatus } from '../hooks'
import { UserFormDialog } from './UserFormDialog'
import type { User, UserFilters } from '../types'

export function UsersTable() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [filters, setFilters] = useState<UserFilters>({})

  const { data: usersResponse, isLoading, error } = useUsers(filters)
  const toggleUserStatusMutation = useToggleUserStatus()

  const handleCreateUser = () => {
    setSelectedUser(null)
    setShowUserDialog(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setShowUserDialog(true)
  }

  const handleToggleStatus = async (user: User) => {
    try {
      await toggleUserStatusMutation.mutateAsync(user.id)
    } catch (error) {
      console.error('Error toggling user status:', error)
    }
  }

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value || undefined }))
  }

  const handleRoleFilterChange = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      role: value === 'all' ? undefined : value as 'admin' | 'waiter'
    }))
  }

  const handleStatusFilterChange = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      active: value === 'all' ? undefined : value === 'active'
    }))
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-red-500">Error al cargar usuarios: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Usuarios</h2>
          <p className="text-muted-foreground">
            Gestiona los usuarios del sistema
          </p>
        </div>
        <Button onClick={handleCreateUser}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filters.role || 'all'} onValueChange={handleRoleFilterChange}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="waiter">Mesero</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.active === undefined ? 'all' : filters.active ? 'active' : 'inactive'} 
          onValueChange={handleStatusFilterChange}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando usuarios...</div>
        ) : usersResponse?.users.length ? (
          usersResponse.users.map((user) => (
            <div key={user.id} className="p-4 border rounded-lg bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{user.name}</div>
                  <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? 'Administrador' : 'Mesero'}
                    </Badge>
                    <Badge variant={user.active ? 'default' : 'secondary'}>
                      {user.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {new Date(user.created_at).toLocaleDateString('es-ES')}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => handleEditUser(user)} className="h-9">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant={user.active ? 'secondary' : 'default'}
                    size="sm"
                    onClick={() => handleToggleStatus(user)}
                    disabled={toggleUserStatusMutation.isPending}
                    className="h-9"
                  >
                    {user.active ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">No se encontraron usuarios</div>
        )}
      </div>

      {/* Table */}
      <div className="hidden lg:block overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha de Creación</TableHead>
              <TableHead className="w-[70px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Cargando usuarios...
                </TableCell>
              </TableRow>
            ) : usersResponse?.users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            ) : (
              usersResponse?.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? 'Administrador' : 'Mesero'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.active ? 'default' : 'secondary'}>
                      {user.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Abrir menú de acciones de usuario">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleToggleStatus(user)}
                          disabled={toggleUserStatusMutation.isPending}
                        >
                          {user.active ? (
                            <>
                              <ToggleLeft className="mr-2 h-4 w-4" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <ToggleRight className="mr-2 h-4 w-4" />
                              Activar
                            </>
                          )}
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

      {/* Stats */}
      {usersResponse && (
        <div className="text-sm text-muted-foreground">
          Total: {usersResponse.total} usuarios
        </div>
      )}

      {/* Dialog */}
      <UserFormDialog
        open={showUserDialog}
        onClose={() => setShowUserDialog(false)}
        user={selectedUser}
      />
    </div>
  )
}