'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useCreateUser, useUpdateUser, useDeleteUser } from '../hooks'
import { userFormSchema, userUpdateSchema } from '../validations'
import type { User, UserFormData, UserUpdateData } from '../types'

interface UserFormDialogProps {
  open: boolean
  onClose: () => void
  user?: User | null
}

export function UserFormDialog({ open, onClose, user }: UserFormDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const isEditing = !!user

  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()
  const deleteUserMutation = useDeleteUser()

  const form = useForm<UserFormData | UserUpdateData>({
    resolver: zodResolver(isEditing ? userUpdateSchema : userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'waiter',
      active: true,
    },
  })

  // Reset form when dialog opens/closes or user changes
  useEffect(() => {
    if (open) {
      if (user) {
        form.reset({
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
        })
      } else {
        form.reset({
          name: '',
          email: '',
          password: '',
          role: 'waiter',
          active: true,
        })
      }
    }
  }, [open, user, form])

  const onSubmit = async (data: UserFormData | UserUpdateData) => {
    try {
      if (isEditing && user) {
        await updateUserMutation.mutateAsync({
          id: user.id,
          data: data as UserUpdateData,
        })
      } else {
        await createUserMutation.mutateAsync(data as UserFormData)
      }
      onClose()
    } catch (error) {
      console.error('Error saving user:', error)
    }
  }

  const handleDelete = async () => {
    if (!user) return
    
    try {
      await deleteUserMutation.mutateAsync(user.id)
      onClose()
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const isLoading = createUserMutation.isPending || updateUserMutation.isPending || deleteUserMutation.isPending

  if (showDeleteConfirm) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Desactivación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres desactivar al usuario {user?.name}? 
              El usuario no podrá acceder al sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Desactivando...' : 'Desactivar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica los datos del usuario.' 
              : 'Completa los datos para crear un nuevo usuario. El usuario quedará activo por defecto.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="usuario@ejemplo.com" 
                      {...field} 
                      disabled={isEditing} // No permitir cambiar email en edición
                    />
                  </FormControl>
                  <FormMessage />
                  {isEditing && (
                    <p className="text-sm text-muted-foreground">
                      El email no se puede modificar
                    </p>
                  )}
                </FormItem>
              )}
            />

            {!isEditing && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Contraseña" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="waiter">Mesero</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Usuario activo</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Los usuarios inactivos no pueden acceder al sistema
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-between">
              <div>
                {isEditing && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isLoading}
                  >
                    Desactivar
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading 
                    ? (isEditing ? 'Actualizando...' : 'Creando...') 
                    : (isEditing ? 'Actualizar' : 'Crear Usuario')
                  }
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}