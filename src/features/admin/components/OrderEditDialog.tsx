import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils'
import {
  Edit3,
  Minus,
  Plus,
  Trash2,
  Save,
  X,
  AlertTriangle,
  ShoppingCart,
  Package
} from 'lucide-react'
import { useRemoveOrderItem, useUpdateOrderItem } from '../hooks'
import { useRole } from '@/hooks/useRole'
import type { Order, OrderItem } from '../types'

interface OrderEditDialogProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ItemEdit {
  id: number
  quantity: number
  originalQuantity: number
}

export default function OrderEditDialog({ order, open, onOpenChange }: OrderEditDialogProps) {
  return (
    <OrderEditDialogContent order={order} open={open} onOpenChange={onOpenChange} />
  )
}

function OrderEditDialogContent({ order, open, onOpenChange }: OrderEditDialogProps) {
  const [editingItems, setEditingItems] = useState<Record<number, ItemEdit>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive' | 'success' | 'warning'
    onConfirm: () => void
    loading?: boolean
  } | null>(null)

  const removeOrderItem = useRemoveOrderItem()
  const updateOrderItem = useUpdateOrderItem()
  const { addToast, toasts, removeToast } = useToast()
  const { isAdmin } = useRole()

  const initializeEditingItems = useCallback(() => {
    if (!order?.items || order.items.length === 0) return {}

    const items: Record<number, ItemEdit> = {}
    order.items.forEach(item => {
      items[item.id] = {
        id: item.id,
        quantity: item.quantity,
        originalQuantity: item.quantity
      }
    })
    return items
  }, [order])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (newOpen && order) {
      setEditingItems(initializeEditingItems())
      setHasChanges(false)
    }
    onOpenChange(newOpen)
  }, [initializeEditingItems, onOpenChange, order])

  useEffect(() => {
    if (open && order) {
      handleOpenChange(open)
    }
  }, [handleOpenChange, open, order])


  if (!isAdmin()) return null

  const updateItemQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 0) return

    setEditingItems(prev => {
      const updated = {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          quantity: newQuantity
        }
      }

      const hasChangesNow = Object.values(updated).some(item =>
        item.quantity !== item.originalQuantity
      )
      setHasChanges(hasChangesNow)

      return updated
    })
  }

  const handleRemoveItem = async (item: OrderItem) => {
    setConfirmDialog({
      open: true,
      title: 'Confirmar eliminación',
      description: `¿Está seguro de eliminar "${item.name}" de la orden? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await removeOrderItem.mutateAsync({
            orderItemId: item.id,
            quantity: item.quantity
          })

          // Remove from editing state
          setEditingItems(prev => {
            const updated = { ...prev }
            delete updated[item.id]
            return updated
          })

          // Show success message
          addToast({
            title: 'Item eliminado',
            description: `"${item.name}" ha sido eliminado de la orden`,
            variant: 'success'
          })

          // Check if dialog should close (no items left)
          const remainingItems = Object.keys(editingItems).length - 1
          if (remainingItems === 0) {
            onOpenChange(false)
          }

          setConfirmDialog(null)
        } catch (error) {
          console.error('Error removing item:', error)
          addToast({
            title: 'Error al eliminar',
            description: 'No se pudo eliminar el item. Intente nuevamente.',
            variant: 'error'
          })
        }
      },
      loading: removeOrderItem.isPending
    })
  }

  const handleSaveChanges = async () => {
    const changedItems = Object.values(editingItems).filter(item =>
      item.quantity !== item.originalQuantity
    )

    if (changedItems.length === 0) {
      onOpenChange(false)
      return
    }

    try {
      // Process all changes
      for (const item of changedItems) {
        await updateOrderItem.mutateAsync({
          orderItemId: item.id,
          quantity: item.quantity
        })
      }

      // Show success message
      addToast({
        title: 'Cambios guardados',
        description: `Se ${changedItems.length === 1 ? 'actualizó' : 'actualizaron'} ${changedItems.length} item${changedItems.length === 1 ? '' : 's'} correctamente`,
        variant: 'success'
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Error updating items:', error)
      addToast({
        title: 'Error al guardar',
        description: 'No se pudieron guardar todos los cambios. Intente nuevamente.',
        variant: 'error'
      })
    }
  }

  const calculateTotals = () => {
    if (!order?.items || order.items.length === 0) return { subtotal: 0, tax: 0, total: 0 }

    let subtotal = 0
    let tax = 0

    Object.values(editingItems).forEach(item => {
      const originalItem = order.items.find(oi => oi.id === item.id)
      if (originalItem) {
        // Buscar el menu item completo para obtener base_price
        const orderItem = order.order_items?.find(oi => oi.id === item.id)
        const menuItem = orderItem?.menu_items
        
        // Usar base_price si está disponible, sino usar price
        const unitPrice = menuItem?.base_price || originalItem.price
        const itemSubtotal = unitPrice * item.quantity
        subtotal += itemSubtotal
        
        const itemTaxRate = menuItem?.tax || 0
        tax += itemSubtotal * itemTaxRate
      }
    })

    const total = subtotal + tax

    return { subtotal, tax, total }
  }

  if (!order) return null

  const { subtotal, tax, total } = calculateTotals()
  const savings = order.total_amount - total
  const hasItems = order.items && order.items.length > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Editar Orden - Mesa {order.table_number}
          </DialogTitle>
          <DialogDescription>
            Modifique las cantidades o elimine items de la orden. Solo los administradores pueden realizar estos cambios.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 -mr-1">
          <div className="space-y-4">
            {/* Order Items */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span className="font-medium">Items de la Orden</span>
                <Badge variant="outline">
                  {Object.keys(editingItems).length} items
                </Badge>
              </div>

              {!hasItems ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="font-medium text-lg mb-2">No hay items en esta orden</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Esta orden no tiene items asociados. Puede que sea una orden de prueba o que los items no se hayan cargado correctamente.
                  </p>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Información de la orden:</strong><br />
                      ID: {order.id}<br />
                      Total: {formatCurrency(order.total_amount)}<br />
                      Estado: {order.status}
                    </p>
                  </div>
                </div>
              ) : (
                Object.values(editingItems).map(editItem => {
                  const originalItem = order.items.find(item => item.id === editItem.id)
                  if (!originalItem) return null

                  const itemTotal = originalItem.price * editItem.quantity
                  const isChanged = editItem.quantity !== editItem.originalQuantity

                  return (
                    <div
                      key={editItem.id}
                      className={`p-4 rounded-lg border ${isChanged ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50'}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{originalItem.name}</span>
                            {isChanged && <Badge variant="secondary">Modificado</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(originalItem.price)} c/u
                            {originalItem.category && ` • ${originalItem.category}`}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(editItem.id, editItem.quantity - 1)}
                              disabled={editItem.quantity <= 0}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>

                            <div className="w-12 sm:w-16">
                              <Input
                                type="number"
                                min="0"
                                value={editItem.quantity}
                                onChange={(e) => updateItemQuantity(editItem.id, parseInt(e.target.value) || 0)}
                                className="text-center text-sm h-8"
                              />
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(editItem.id, editItem.quantity + 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Item Total */}
                          <div className="text-right min-w-[60px] sm:min-w-[80px]">
                            <div className="font-medium text-sm sm:text-base">
                              {formatCurrency(itemTotal)}
                            </div>
                            {isChanged && (
                              <div className="text-xs text-muted-foreground">
                                Antes: {formatCurrency(originalItem.price * editItem.originalQuantity)}
                              </div>
                            )}
                          </div>

                          {/* Remove Button */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveItem(originalItem)}
                            disabled={removeOrderItem.isPending}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {hasItems && (
              <>
                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Impuestos (8%):</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>

                  {hasChanges && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Original:</span>
                      <span className="text-muted-foreground">{formatCurrency(order.total_amount)}</span>
                    </div>
                  )}

                  {savings !== 0 && (
                    <div className="flex justify-between text-sm font-medium">
                      <span className={savings > 0 ? "text-green-600" : "text-red-600"}>
                        {savings > 0 ? "Ahorro:" : "Incremento:"}
                      </span>
                      <span className={savings > 0 ? "text-green-600" : "text-red-600"}>
                        {savings > 0 ? "-" : "+"}{formatCurrency(Math.abs(savings))}
                      </span>
                    </div>
                  )}
                </div>

                {/* Warning for changes */}
                {hasChanges && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">Hay cambios pendientes</p>
                      <p className="text-yellow-700">
                        Los cambios se aplicarán cuando presione "Guardar Cambios".
                        Los totales de la orden se recalcularán automáticamente.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>

            {hasChanges && hasItems && (
              <Button
                type="button"
                onClick={handleSaveChanges}
                disabled={removeOrderItem.isPending}
                className="w-full sm:w-auto sm:min-w-[140px]"
              >
                <Save className="h-4 w-4 mr-2" />
                {removeOrderItem.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>

      {/* Custom Confirmation Dialog */}
      {confirmDialog && (
        <AlertDialog
          open={true}
          onOpenChange={() => setConfirmDialog(null)}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          loading={confirmDialog.loading}
        />
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Dialog>
  )
}