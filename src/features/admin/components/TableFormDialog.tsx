'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useCreateTable, useUpdateTable, useDeleteTable } from '../hooks'
import type { Table, TableFormData } from '../types'

interface TableFormDialogProps {
  open: boolean
  onClose: () => void
  table?: Table | null
}

export function TableFormDialog({ open, onClose, table }: TableFormDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState<TableFormData>({
    number: '',
    capacity: 4,
    active: true,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof TableFormData, string>>>({})
  
  const isEditing = !!table

  const createTableMutation = useCreateTable()
  const updateTableMutation = useUpdateTable()
  const deleteTableMutation = useDeleteTable()

  // Reset form when dialog opens/closes or table changes
  useEffect(() => {
    if (open) {
      if (table) {
        setFormData({
          number: table.number,
          capacity: table.capacity,
          active: table.active,
        })
      } else {
        setFormData({
          number: '',
          capacity: 4,
          active: true,
        })
      }
      setErrors({})
    }
  }, [open, table])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TableFormData, string>> = {}

    if (!formData.number.trim()) {
      newErrors.number = 'El número de mesa es requerido'
    }

    if (formData.capacity < 1) {
      newErrors.capacity = 'La capacidad debe ser al menos 1'
    }

    if (formData.capacity > 20) {
      newErrors.capacity = 'La capacidad máxima es 20'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      if (isEditing && table) {
        await updateTableMutation.mutateAsync({
          id: table.id,
          data: formData,
        })
      } else {
        await createTableMutation.mutateAsync(formData)
      }
      onClose()
    } catch (error) {
      console.error('Error saving table:', error)
    }
  }

  const handleDelete = async () => {
    if (!table) return
    
    try {
      await deleteTableMutation.mutateAsync(table.id)
      onClose()
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Error deleting table:', error)
    }
  }

  const isLoading = createTableMutation.isPending || updateTableMutation.isPending || deleteTableMutation.isPending

  if (showDeleteConfirm) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar la mesa {table?.number}? Esta acción no se puede deshacer.
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
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Mesa' : 'Nueva Mesa'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica los datos de la mesa.' 
              : 'Completa los datos para crear una nueva mesa.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 space-y-4 overflow-y-auto px-1">
          <div className="space-y-2">
            <Label htmlFor="number">Número de Mesa</Label>
            <Input
              id="number"
              placeholder="Ej: 1, A1, VIP-1"
              value={formData.number}
              onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
              className={errors.number ? 'border-red-500' : ''}
            />
            {errors.number && (
              <p className="text-sm text-red-500">{errors.number}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capacidad (personas)</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              max="20"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                capacity: parseInt(e.target.value) || 1 
              }))}
              className={errors.capacity ? 'border-red-500' : ''}
            />
            {errors.capacity && (
              <p className="text-sm text-red-500">{errors.capacity}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData(prev => ({ 
                ...prev, 
                active: !!checked 
              }))}
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="active">Mesa activa</Label>
              <p className="text-sm text-muted-foreground">
                Las mesas inactivas no aparecerán disponibles para nuevas órdenes.
              </p>
            </div>
          </div>

          <DialogFooter className="flex justify-between border-t pt-4 mt-2">
            <div>
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isLoading}
                >
                  Eliminar
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="sm:min-w-[120px]">
                {isLoading 
                  ? (isEditing ? 'Actualizando...' : 'Creando...') 
                  : (isEditing ? 'Actualizar' : 'Crear')
                }
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}