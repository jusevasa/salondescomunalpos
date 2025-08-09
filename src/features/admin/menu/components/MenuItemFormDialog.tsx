import { useState, useEffect } from 'react'
import { useForm, type FieldValues, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Plus, Calculator } from 'lucide-react'
import { 
  useCreateMenuItem, 
  useUpdateMenuItem, 
  useDeleteMenuItem, 
  useMenuCategories,
  useSides 
} from '../hooks'
import { menuItemFormSchema, type MenuItemFormData } from '../validations'
import type { MenuItem } from '../types'
import { useToast } from '@/components/ui/toast'

interface MenuItemFormDialogProps {
  open: boolean
  onClose: () => void
  menuItem?: MenuItem | null
}

export default function MenuItemFormDialog({ open, onClose, menuItem }: MenuItemFormDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [autoBasePrice, setAutoBasePrice] = useState(true)
  const isEditing = !!menuItem

  const createMenuItemMutation = useCreateMenuItem()
  const updateMenuItemMutation = useUpdateMenuItem()
  const deleteMenuItemMutation = useDeleteMenuItem()
  const { data: categoriesData } = useMenuCategories({}, 1, 100)
  const { data: sidesData } = useSides({}, 1, 100)
  const { addToast } = useToast()

  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemFormSchema) as Resolver<MenuItemFormData>,
    defaultValues: {
      name: '',
      price: 0,
      category_id: 1,
      active: true,
      tax: 8,
      fee: 10,
      has_cooking_point: false,
      has_sides: false,
      max_sides_count: 0,
    }
  });

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = form
  const watchSideIds = watch('side_ids')
  const watchPrice = watch('price')
  const watchTax = watch('tax')

  // Reset form when dialog opens/closes or menu item changes
  useEffect(() => {
    if (open) {
      setAutoBasePrice(true)
      if (menuItem) {
        reset({
          name: menuItem.name,
          price: menuItem.price,
          base_price: menuItem.base_price || undefined,
          category_id: menuItem.category_id,
          active: menuItem.active,
          tax: menuItem.tax,
          fee: menuItem.fee,
          author: menuItem.author,
          has_cooking_point: menuItem.has_cooking_point,
          has_sides: menuItem.has_sides,
          side_ids: menuItem.item_sides?.map(is => is.side_id) || undefined,
          max_sides_count: menuItem.max_sides_count || 0
        })
      } else {
        reset({
          name: '',
          price: 0,
          base_price: undefined,
          category_id: categoriesData?.categories[0]?.id || 1,
          active: true,
          tax: 8,
          fee: 10,
          author: '',
          has_cooking_point: false,
          has_sides: false,
          side_ids: undefined,
          max_sides_count: 0
        })
      }
    }
  }, [open, menuItem, categoriesData, reset])

  // Calcular automáticamente el precio base cuando cambien el precio de venta o el impuesto
  useEffect(() => {
    if (autoBasePrice && watchPrice > 0 && watchTax >= 0) {
      const taxDecimal = watchTax / 100
      const basePrice = watchPrice / (1 + taxDecimal)
      const roundedBasePrice = Math.round(basePrice * 100) / 100
      setValue('base_price', roundedBasePrice)
    }
  }, [autoBasePrice, watchPrice, watchTax, setValue])

  const onSubmit = async (data: FieldValues) => {
    try {
      const formData = data as MenuItemFormData
      const submitData = {
        ...formData,
        base_price: formData.base_price || undefined,
        side_ids: formData.has_sides ? formData.side_ids : undefined,
        max_sides_count: formData.has_sides ? formData.max_sides_count : 0
      }

      if (isEditing && menuItem) {
        await updateMenuItemMutation.mutateAsync({
          id: menuItem.id,
          data: submitData
        })
        addToast({ title: 'Éxito', description: 'Ítem actualizado', variant: 'success' })
      } else {
        await createMenuItemMutation.mutateAsync(submitData)
        addToast({ title: 'Éxito', description: 'Ítem creado', variant: 'success' })
      }
      onClose()
    } catch (error) {
      addToast({ title: 'Error', description: 'No se pudo guardar el ítem', variant: 'error' })
    }
  }

  const handleDelete = async () => {
    if (!menuItem) return
    
    try {
      await deleteMenuItemMutation.mutateAsync(menuItem.id)
      addToast({ title: 'Éxito', description: 'Ítem eliminado', variant: 'success' })
      onClose()
      setShowDeleteConfirm(false)
    } catch (error) {
      addToast({ title: 'Error', description: 'No se pudo eliminar el ítem', variant: 'error' })
    }
  }

  const addSide = (sideId: number) => {
    const currentSides = watchSideIds || []
    if (!currentSides.includes(sideId)) {
      setValue('side_ids', [...currentSides, sideId])
    }
  }

  const removeSide = (sideId: number) => {
    const currentSides = watchSideIds || []
    const newSides = currentSides.filter(id => id !== sideId)
    setValue('side_ids', newSides.length > 0 ? newSides : undefined)
  }

  // Función para calcular el precio base automáticamente
  const calculateBasePrice = () => {
    const salePrice = watch('price')
    const taxPercentage = watch('tax')
    
    if (salePrice > 0 && taxPercentage >= 0) {
      // Convertir el porcentaje a decimal (ej: 8% = 0.08)
      const taxDecimal = taxPercentage / 100
      // Calcular precio base: precio_venta / (1 + impuesto)
      const basePrice = salePrice / (1 + taxDecimal)
      // Redondear a 2 decimales
      const roundedBasePrice = Math.round(basePrice * 100) / 100
      setValue('base_price', roundedBasePrice)
    }
  }

  const isLoading = createMenuItemMutation.isPending || updateMenuItemMutation.isPending || deleteMenuItemMutation.isPending

  if (showDeleteConfirm) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar el item "{menuItem?.name}"? Esta acción no se puede deshacer.
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
      <DialogContent className="max-w-[95vw] sm:max-w-[720px] max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Item del Menú' : 'Nuevo Item del Menú'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica los datos del item del menú.' 
              : 'Completa los datos para crear un nuevo item del menú.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Información básica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Item</Label>
              <Input
                id="name"
                placeholder="Ej: Hamburguesa Clásica"
                {...register('name')}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Autor</Label>
              <Input
                id="author"
                placeholder="Nombre del chef o creador"
                {...register('author')}
                className={errors.author ? 'border-red-500' : ''}
              />
              {errors.author && (
                <p className="text-sm text-red-500">{errors.author.message}</p>
              )}
            </div>
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Select
              value={watch('category_id').toString()}
              onValueChange={(value) => setValue('category_id', parseInt(value))}
            >
              <SelectTrigger className={errors.category_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categoriesData?.categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && (
              <p className="text-sm text-red-500">{errors.category_id.message}</p>
            )}
          </div>

          {/* Precios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Precio de Venta</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                {...register('price', { valueAsNumber: true })}
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price && (
                <p className="text-sm text-red-500">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_price">Precio base</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('base_price', { valueAsNumber: true })}
                  placeholder={autoBasePrice ? 'Se calcula automáticamente' : 'Ingresa el precio base'}
                  disabled={autoBasePrice}
                />
                {!autoBasePrice && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={calculateBasePrice}
                    disabled={!watch('price') || watch('price') <= 0}
                  >
                    <Calculator className="h-4 w-4 mr-1" />
                    Calcular precio base
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="auto_base_price"
                  checked={autoBasePrice}
                  onCheckedChange={(checked) => setAutoBasePrice(Boolean(checked))}
                />
                <Label htmlFor="auto_base_price" className="text-sm">Calcular automáticamente con precio e impuesto</Label>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Fórmula: Precio de venta ÷ (1 + Impuesto%)</p>
                {watchPrice > 0 && watchTax >= 0 && (
                  <p className="text-blue-600 font-medium">
                    Ejemplo: ${watchPrice} ÷ (1 + {watchTax}%) = ${((watchPrice / (1 + watchTax / 100)) || 0).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Impuestos y comisiones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax">Impuesto (%)</Label>
              <Input
                id="tax"
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('tax', { valueAsNumber: true })}
                className={errors.tax ? 'border-red-500' : ''}
              />
              {errors.tax && (
                <p className="text-sm text-red-500">{errors.tax.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee">Comisión (%)</Label>
              <Input
                id="fee"
                type="number"
                step="0.01"
                min="0"
                {...register('fee', { valueAsNumber: true })}
                className={errors.fee ? 'border-red-500' : ''}
              />
              {errors.fee && (
                <p className="text-sm text-red-500">{errors.fee.message}</p>
              )}
            </div>
          </div>

          {/* Opciones */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={watch('active')}
                onCheckedChange={(checked) => setValue('active', checked as boolean)}
              />
              <Label htmlFor="active">Item activo</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_cooking_point"
                checked={watch('has_cooking_point')}
                onCheckedChange={(checked) => setValue('has_cooking_point', checked as boolean)}
              />
              <Label htmlFor="has_cooking_point">Tiene punto de cocción</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_sides"
                checked={watch('has_sides')}
                onCheckedChange={(checked) => {
                  setValue('has_sides', checked as boolean)
                  if (!checked) {
                    setValue('side_ids', undefined)
                    setValue('max_sides_count', 0)
                  }
                }}
              />
              <Label htmlFor="has_sides">Tiene acompañamientos</Label>
            </div>
          </div>

          {/* Configuración de Acompañamientos */}
          {watch('has_sides') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuración de Acompañamientos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cantidad máxima de acompañamientos */}
                <div className="space-y-2">
                  <Label htmlFor="max_sides_count">Cantidad máxima de acompañamientos</Label>
                  <Input
                    id="max_sides_count"
                    type="number"
                    min="0"
                    max="10"
                    {...register('max_sides_count', { valueAsNumber: true })}
                    className={errors.max_sides_count ? 'border-red-500' : ''}
                  />
                  {errors.max_sides_count && (
                    <p className="text-sm text-red-500">{errors.max_sides_count.message}</p>
                  )}
                </div>

                {/* Acompañamientos disponibles para agregar */}
                <div className="space-y-2">
                  <Label>Agregar Acompañamiento</Label>
                  <div className="flex flex-wrap gap-2">
                    {sidesData?.sides
                      .filter(side => !watchSideIds?.includes(side.id))
                      .map((side) => (
                        <Button
                          key={side.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addSide(side.id)}
                          className="text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {side.name}
                        </Button>
                      ))}
                  </div>
                </div>

                {/* Acompañamientos seleccionados */}
                {watchSideIds && watchSideIds.length > 0 && (
                  <div className="space-y-3">
                    <Label>Acompañamientos Seleccionados</Label>
                    <div className="flex flex-wrap gap-2">
                      {watchSideIds.map((sideId) => {
                        const side = sidesData?.sides.find(s => s.id === sideId)
                        return side ? (
                          <Badge key={sideId} variant="secondary" className="text-xs flex items-center gap-1">
                            {side.name}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSide(sideId)}
                              className="h-4 w-4 p-0 hover:bg-transparent"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                )}

                {errors.side_ids && (
                  <p className="text-sm text-red-500">{errors.side_ids.message}</p>
                )}
              </CardContent>
            </Card>
          )}

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