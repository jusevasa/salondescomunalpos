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
import { useCreatePrintStation, useUpdatePrintStation, useDeletePrintStation } from '../hooks'
import { useToast } from '@/components/ui/toast'
import type { PrintStation, PrintStationFormData } from '../types'

interface PrintStationFormDialogProps {
  open: boolean
  onClose: () => void
  printStation?: PrintStation | null
}

export default function PrintStationFormDialog({ open, onClose, printStation }: PrintStationFormDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState<PrintStationFormData>({
    name: '',
    code: '',
    printer_ip: '',
    active: true,
    display_order: 1
  })
  const [errors, setErrors] = useState<Partial<Record<keyof PrintStationFormData, string>>>({})
  
  const isEditing = !!printStation

  const createPrintStationMutation = useCreatePrintStation()
  const updatePrintStationMutation = useUpdatePrintStation()
  const deletePrintStationMutation = useDeletePrintStation()
  const { addToast } = useToast()

  // Reset form when dialog opens/closes or print station changes
  useEffect(() => {
    if (open) {
      if (printStation) {
        setFormData({
          name: printStation.name,
          code: printStation.code,
          printer_ip: printStation.printer_ip || '',
          active: printStation.active,
          display_order: printStation.display_order
        })
      } else {
        setFormData({
          name: '',
          code: '',
          printer_ip: '',
          active: true,
          display_order: 1
        })
      }
      setErrors({})
    }
  }, [open, printStation])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PrintStationFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la estación es requerido'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'El código de la estación es requerido'
    }

    if (formData.display_order < 1) {
      newErrors.display_order = 'El orden debe ser al menos 1'
    }

    // Validar formato de IP si se proporciona
    if (formData.printer_ip && formData.printer_ip.trim()) {
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
      if (!ipRegex.test(formData.printer_ip.trim())) {
        newErrors.printer_ip = 'Formato de IP inválido'
      }
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
      const submitData = {
        ...formData,
        printer_ip: formData.printer_ip?.trim() || undefined
      }

      if (isEditing && printStation) {
        await updatePrintStationMutation.mutateAsync({
          id: printStation.id,
          data: submitData
        })
        addToast({ title: 'Éxito', description: 'Estación actualizada', variant: 'success' })
      } else {
        await createPrintStationMutation.mutateAsync(submitData)
        addToast({ title: 'Éxito', description: 'Estación creada', variant: 'success' })
      }
      onClose()
    } catch (error) {
      addToast({ title: 'Error', description: 'No se pudo guardar la estación', variant: 'error' })
    }
  }

  const handleDelete = async () => {
    if (!printStation) return
    
    try {
      await deletePrintStationMutation.mutateAsync(printStation.id)
      addToast({ title: 'Éxito', description: 'Estación eliminada', variant: 'success' })
      onClose()
      setShowDeleteConfirm(false)
    } catch (error) {
      addToast({ title: 'Error', description: 'No se pudo eliminar la estación', variant: 'error' })
    }
  }

  const isLoading = createPrintStationMutation.isPending || updatePrintStationMutation.isPending || deletePrintStationMutation.isPending

  if (showDeleteConfirm) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar la estación de impresión "{printStation?.name}"? Esta acción no se puede deshacer y afectará todas las categorías asociadas.
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
            {isEditing ? 'Editar Estación de Impresión' : 'Nueva Estación de Impresión'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica los datos de la estación de impresión.' 
              : 'Completa los datos para crear una nueva estación de impresión.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 space-y-4 overflow-y-auto px-1">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Estación</Label>
            <Input
              id="name"
              placeholder="Ej: Cocina Principal, Bar, Parrilla"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Código de la Estación</Label>
            <Input
              id="code"
              placeholder="Ej: COCINA, BAR, PARRILLA"
              value={formData.code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              className={errors.code ? 'border-red-500' : ''}
            />
            {errors.code && (
              <p className="text-sm text-red-500">{errors.code}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="printer_ip">IP de la Impresora (Opcional)</Label>
            <Input
              id="printer_ip"
              placeholder="Ej: 192.168.1.100"
              value={formData.printer_ip}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, printer_ip: e.target.value }))}
              className={errors.printer_ip ? 'border-red-500' : ''}
            />
            {errors.printer_ip && (
              <p className="text-sm text-red-500">{errors.printer_ip}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Dirección IP de la impresora térmica asociada a esta estación
            </p>
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
            <Label htmlFor="active">Estación activa</Label>
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