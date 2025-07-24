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
import { useCreateCookingPoint, useUpdateCookingPoint, useDeleteCookingPoint } from '../hooks'
import type { CookingPoint, CookingPointFormData } from '../types'

interface CookingPointFormDialogProps {
  open: boolean
  onClose: () => void
  cookingPoint?: CookingPoint | null
}

export default function CookingPointFormDialog({ open, onClose, cookingPoint }: CookingPointFormDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState<CookingPointFormData>({
    name: '',
    active: true,
    display_order: 1
  })
  const [errors, setErrors] = useState<Partial<Record<keyof CookingPointFormData, string>>>({})
  
  const isEditing = !!cookingPoint

  const createCookingPointMutation = useCreateCookingPoint()
  const updateCookingPointMutation = useUpdateCookingPoint()
  const deleteCookingPointMutation = useDeleteCookingPoint()

  // Reset form when dialog opens/closes or cooking point changes
  useEffect(() => {
    if (open) {
      if (cookingPoint) {
        setFormData({
          name: cookingPoint.name,
          active: cookingPoint.active,
          display_order: cookingPoint.display_order
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
  }, [open, cookingPoint])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CookingPointFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del punto de cocción es requerido'
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
      if (isEditing && cookingPoint) {
        await updateCookingPointMutation.mutateAsync({
          id: cookingPoint.id,
          data: formData
        })
      } else {
        await createCookingPointMutation.mutateAsync(formData)
      }
      onClose()
    } catch (error) {
      console.error('Error saving cooking point:', error)
    }
  }

  const handleDelete = async () => {
    if (!cookingPoint) return
    
    try {
      await deleteCookingPointMutation.mutateAsync(cookingPoint.id)
      onClose()
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Error deleting cooking point:', error)
    }
  }

  const isLoading = createCookingPointMutation.isPending || updateCookingPointMutation.isPending || deleteCookingPointMutation.isPending

  if (showDeleteConfirm) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar el punto de cocción "{cookingPoint?.name}"? Esta acción no se puede deshacer.
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
            {isEditing ? 'Editar Punto de Cocción' : 'Nuevo Punto de Cocción'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica los datos del punto de cocción.' 
              : 'Completa los datos para crear un nuevo punto de cocción.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Punto de Cocción</Label>
            <Input
              id="name"
              placeholder="Ej: Al Punto, Término Medio, Bien Cocido"
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
            <Label htmlFor="active">Punto de cocción activo</Label>
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