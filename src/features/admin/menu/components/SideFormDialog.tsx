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
import { useCreateSide, useUpdateSide, useDeleteSide } from '../hooks'
import type { Side, SideFormData } from '../types'

interface SideFormDialogProps {
  open: boolean
  onClose: () => void
  side?: Side | null
}

export default function SideFormDialog({ open, onClose, side }: SideFormDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState<SideFormData>({
    name: '',
    active: true,
    display_order: 1
  })
  const [errors, setErrors] = useState<Partial<Record<keyof SideFormData, string>>>({})
  
  const isEditing = !!side

  const createSideMutation = useCreateSide()
  const updateSideMutation = useUpdateSide()
  const deleteSideMutation = useDeleteSide()

  // Reset form when dialog opens/closes or side changes
  useEffect(() => {
    if (open) {
      if (side) {
        setFormData({
          name: side.name,
          active: side.active,
          display_order: side.display_order
        })
      } else {
        setFormData({
          name: '',
          active: true,
          display_order: 1
        })
      }
      setErrors({})
    }
  }, [open, side])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SideFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del acompañamiento es requerido'
    }

    if (formData.display_order < 1) {
      newErrors.display_order = 'El orden debe ser al menos 1'
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
      if (isEditing && side) {
        await updateSideMutation.mutateAsync({
          id: side.id,
          data: formData
        })
      } else {
        await createSideMutation.mutateAsync(formData)
      }
      onClose()
    } catch (error) {
      console.error('Error saving side:', error)
    }
  }

  const handleDelete = async () => {
    if (!side) return
    
    try {
      await deleteSideMutation.mutateAsync(side.id)
      onClose()
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Error deleting side:', error)
    }
  }

  const isLoading = createSideMutation.isPending || updateSideMutation.isPending || deleteSideMutation.isPending

  if (showDeleteConfirm) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar el acompañamiento "{side?.name}"? Esta acción no se puede deshacer.
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Acompañamiento' : 'Nuevo Acompañamiento'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica los datos del acompañamiento.' 
              : 'Completa los datos para crear un nuevo acompañamiento.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Acompañamiento</Label>
            <Input
              id="name"
              placeholder="Ej: Arroz, Papas Fritas, Ensalada"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_order">Orden de Visualización</Label>
            <Input
              id="display_order"
              type="number"
              min="1"
              value={formData.display_order}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ 
                ...prev, 
                display_order: parseInt(e.target.value) || 1 
              }))}
              className={errors.display_order ? 'border-red-500' : ''}
            />
            {errors.display_order && (
              <p className="text-sm text-red-500">{errors.display_order}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData(prev => ({ 
                ...prev, 
                active: checked as boolean 
              }))}
            />
            <Label htmlFor="active">Acompañamiento activo</Label>
          </div>

          <DialogFooter className="flex justify-between">
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