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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateMenuCategory, useUpdateMenuCategory, useDeleteMenuCategory, usePrintStations } from '../hooks'
import { useToast } from '@/components/ui/toast'
import type { MenuCategory, MenuCategoryFormData } from '../types'

interface CategoryFormDialogProps {
  open: boolean
  onClose: () => void
  category?: MenuCategory | null
}

export default function CategoryFormDialog({ open, onClose, category }: CategoryFormDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState<MenuCategoryFormData>({
    name: '',
    description: '',
    active: true,
    display_order: 1,
    print_station_id: 0
  })
  const [errors, setErrors] = useState<Partial<Record<keyof MenuCategoryFormData, string>>>({})
  
  const isEditing = !!category

  const createCategoryMutation = useCreateMenuCategory()
  const updateCategoryMutation = useUpdateMenuCategory()
  const deleteCategoryMutation = useDeleteMenuCategory()
  const { data: printStationsData } = usePrintStations({}, 1, 100)
  const { addToast } = useToast()

  // Reset form when dialog opens/closes or category changes
  useEffect(() => {
    if (open) {
      if (category) {
        setFormData({
          name: category.name,
          description: category.description || '',
          active: category.active,
          display_order: category.display_order,
          print_station_id: category.print_station_id
        })
      } else {
        setFormData({
          name: '',
          description: '',
          active: true,
          display_order: 1,
          print_station_id: printStationsData?.print_stations[0]?.id || 0
        })
      }
      setErrors({})
    }
  }, [open, category, printStationsData])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof MenuCategoryFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la categoría es requerido'
    }

    if (formData.display_order < 1) {
      newErrors.display_order = 'El orden debe ser al menos 1'
    }

    if (!formData.print_station_id) {
      newErrors.print_station_id = 'Debe seleccionar una estación de impresión'
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
      if (isEditing && category) {
        await updateCategoryMutation.mutateAsync({
          id: category.id,
          data: formData
        })
        addToast({ title: 'Éxito', description: 'Categoría actualizada correctamente', variant: 'success' })
      } else {
        await createCategoryMutation.mutateAsync(formData)
        addToast({ title: 'Éxito', description: 'Categoría creada correctamente', variant: 'success' })
      }
      onClose()
    } catch (error) {
      addToast({ title: 'Error', description: 'No se pudo guardar la categoría', variant: 'error' })
    }
  }

  const handleDelete = async () => {
    if (!category) return
    
    try {
      await deleteCategoryMutation.mutateAsync(category.id)
      addToast({ title: 'Éxito', description: 'Categoría eliminada correctamente', variant: 'success' })
      onClose()
      setShowDeleteConfirm(false)
    } catch (error) {
      addToast({ title: 'Error', description: 'No se pudo eliminar la categoría', variant: 'error' })
    }
  }

  const isLoading = createCategoryMutation.isPending || updateCategoryMutation.isPending || deleteCategoryMutation.isPending

  if (showDeleteConfirm) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar la categoría "{category?.name}"? Esta acción no se puede deshacer y afectará todos los items asociados.
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
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica los datos de la categoría.' 
              : 'Completa los datos para crear una nueva categoría.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 space-y-4 overflow-y-auto px-1">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Categoría</Label>
            <Input
              id="name"
              placeholder="Ej: Entradas, Platos Principales, Postres"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Input
              id="description"
              placeholder="Descripción de la categoría..."
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="display_order">Orden de Visualización</Label>
              <Input
                id="display_order"
                type="number"
                min="1"
                value={formData.display_order}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  display_order: parseInt(e.target.value) || 1 
                }))}
                className={errors.display_order ? 'border-red-500' : ''}
              />
              {errors.display_order && (
                <p className="text-sm text-red-500">{errors.display_order}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="print_station">Estación de Impresión</Label>
              <Select
                value={formData.print_station_id.toString()}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  print_station_id: parseInt(value) 
                }))}
              >
                <SelectTrigger className={errors.print_station_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Seleccionar estación" />
                </SelectTrigger>
                <SelectContent>
                  {printStationsData?.print_stations.map((station) => (
                    <SelectItem key={station.id} value={station.id.toString()}>
                      {station.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.print_station_id && (
                <p className="text-sm text-red-500">{errors.print_station_id}</p>
              )}
            </div>
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
            <Label htmlFor="active">Categoría activa</Label>
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
            <div className="flex gap-2">
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