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
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils'
import { ArrowRightLeft, X, AlertTriangle } from 'lucide-react'
import { useChangeOrderTable, useTables } from '../hooks'
import { changeTableSchema, type ChangeTableFormData } from '@/lib/validations/orders'
import { deriveAvatarFallback } from '../utils/defaultValues'
import type { Order } from '../types'

interface ChangeTableDialogProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ChangeTableDialog({ order, open, onOpenChange }: ChangeTableDialogProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
    loading?: boolean
  } | null>(null)

  const changeOrderTable = useChangeOrderTable()
  const { data: tablesData } = useTables({ active: true })
  const { addToast, toasts, removeToast } = useToast()

  const form = useForm<ChangeTableFormData>({
    resolver: zodResolver(changeTableSchema),
    defaultValues: {
      newTableId: undefined,
    },
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open && order) {
      form.reset({
        newTableId: undefined,
      })
    }
  }, [open, order, form])

  if (!order) return null

  const currentTableNumber = order.tables?.number || order.table_number?.toString() || 'N/A'
  const currentTableId = order.table_id

  // Filter out current table and get available tables
  const availableTables = tablesData?.tables?.filter(table => table.id !== currentTableId) || []

  const handleSubmit = async (data: ChangeTableFormData) => {
    if (!order) return

    const selectedTable = availableTables.find(t => t.id === data.newTableId)
    if (!selectedTable) return

    // If table is occupied, show confirmation dialog
    if (!selectedTable.status) {
      setConfirmDialog({
        open: true,
        title: 'Mesa ocupada',
        description: `La Mesa ${selectedTable.number} está actualmente ocupada. ¿Está seguro de mover la orden a esta mesa?`,
        onConfirm: async () => {
          setConfirmDialog(null)
          await executeTableChange(data.newTableId, selectedTable.number)
        },
      })
    } else {
      await executeTableChange(data.newTableId, selectedTable.number)
    }
  }

  const executeTableChange = async (newTableId: number, newTableNumber: string) => {
    try {
      await changeOrderTable.mutateAsync({
        orderId: order.id,
        newTableId,
      })

      addToast({
        title: 'Mesa cambiada',
        description: `La orden se movió de la Mesa ${currentTableNumber} a la Mesa ${newTableNumber}`,
        variant: 'success',
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Error changing table:', error)

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'

      addToast({
        title: 'Error al cambiar mesa',
        description: errorMessage,
        variant: 'error',
      })
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Cambiar Mesa de Orden
            </DialogTitle>
            <DialogDescription>
              Seleccione la nueva mesa para esta orden. Los estados de las mesas se actualizarán automáticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Table Information */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="font-medium text-base">
                    {deriveAvatarFallback(currentTableNumber)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Mesa Actual</p>
                  <p className="text-xl font-bold">Mesa {currentTableNumber}</p>
                </div>
              </div>

              <Separator className="mb-3" />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold">{formatCurrency(order.total_amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mesero</p>
                  <p className="font-semibold">{order.waiter || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estado</p>
                  <Badge variant="outline">{order.status}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Hora</p>
                  <p className="font-semibold">
                    {new Date(order.created_at).toLocaleTimeString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Table Selection Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="newTableId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva Mesa</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una mesa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableTables.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              No hay mesas disponibles
                            </div>
                          ) : (
                            availableTables.map((table) => (
                              <SelectItem key={table.id} value={table.id.toString()}>
                                <div className="flex items-center justify-between w-full gap-2">
                                  <span>Mesa {table.number}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {table.status ? '(Disponible)' : '(Ocupada)'}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Warning message */}
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Importante</p>
                    <p className="text-yellow-700">
                      Al cambiar la mesa, la mesa anterior quedará disponible y la nueva mesa quedará ocupada.
                    </p>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={changeOrderTable.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={changeOrderTable.isPending || availableTables.length === 0}
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    {changeOrderTable.isPending ? 'Cambiando...' : 'Cambiar Mesa'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Occupied Tables */}
      {confirmDialog && (
        <AlertDialog
          open={confirmDialog.open}
          onOpenChange={(open) => !open && setConfirmDialog(null)}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmText="Sí, cambiar mesa"
          cancelText="Cancelar"
          variant="warning"
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          loading={confirmDialog.loading}
        />
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  )
}
