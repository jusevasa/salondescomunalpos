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
import { AlertDialog } from '@/components/ui/alert-dialog'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Calculator, CreditCard, DollarSign, Receipt, Printer } from 'lucide-react'
import { usePaymentMethods, useProcessPayment, useInvoiceData, usePrintInvoiceFromPayment } from '../hooks'
import { paymentSchema, cashPaymentSchema } from '@/lib/validations/payment'
import type { PaymentFormData, CashPaymentFormData } from '@/lib/validations/payment'
import type { Order } from '../types'
import { useTableStatus } from '@/features/waiter/hooks/useTableStatus'

interface PaymentDialogProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function PaymentDialog({ order, open, onOpenChange }: PaymentDialogProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [tipMode, setTipMode] = useState<'percentage' | 'amount'>('percentage')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingPaymentData, setPendingPaymentData] = useState<PaymentFormData | CashPaymentFormData | null>(null)
  
  const { data: paymentMethods = [], isLoading: loadingMethods } = usePaymentMethods()
  const processPayment = useProcessPayment()
  const { saveInvoiceData, clearInvoiceData } = useInvoiceData()
  const { printInvoice, isPrinting: isPrintingInvoice } = usePrintInvoiceFromPayment()
  const { freeTable } = useTableStatus();
  
  const isCashPayment = paymentMethods.find(pm => pm.id === parseInt(selectedPaymentMethod))?.code === 'CASH'
  const schema = isCashPayment ? cashPaymentSchema : paymentSchema
  
  const form = useForm<PaymentFormData | CashPaymentFormData>({
    resolver: zodResolver(schema),
    mode: 'onChange'
  })

  const watchedValues = form.watch()
  
  // Función para calcular subtotal basado en base_price
  const calculateBasePriceSubtotal = () => {
    if (!order?.order_items || order.order_items.length === 0) return order?.subtotal || 0
    
    return order.order_items.reduce((sum, item) => {
      const menuItem = item.menu_items
      const unitPrice = menuItem?.base_price || item.unit_price
      return sum + (unitPrice * item.quantity)
    }, 0)
  }
  
  // Calculate totals
  const orderAmount = order?.total_amount || 0
  const subtotalAmount = calculateBasePriceSubtotal() // Usar subtotal basado en base_price
  const tipPercentage = watchedValues.tipPercentage || 0
  const tipAmount = watchedValues.tipAmount || 0
  const receivedAmount = watchedValues.receivedAmount || 0
  
  const calculatedTipAmount = tipMode === 'percentage' ? (subtotalAmount * tipPercentage) / 100 : tipAmount
  const totalToPay = orderAmount + calculatedTipAmount
  const changeAmount = Math.max(0, receivedAmount - totalToPay)

  // Quick tip buttons
  const quickTipPercentages = [0, 10, 15, 20]

  useEffect(() => {
    if (open && order) {
      form.reset()
      setSelectedPaymentMethod('')
      setTipMode('percentage')
      setShowConfirmDialog(false)
      setPendingPaymentData(null)
    } else if (!open) {
      // Limpiar datos de factura cuando se cierra el dialog sin procesar pago
      clearInvoiceData()
      setShowConfirmDialog(false)
      setPendingPaymentData(null)
    }
  }, [open, order, form, clearInvoiceData])

  const onSubmit = async (data: PaymentFormData | CashPaymentFormData) => {
    if (!order) return

    // Guardar los datos del pago y mostrar modal de confirmación
    setPendingPaymentData(data)
    setShowConfirmDialog(true)
  }

  const handleConfirmPayment = async () => {
    if (!order || !pendingPaymentData) return

    try {
      const finalTipAmount = tipMode === 'percentage' ? calculatedTipAmount : pendingPaymentData.tipAmount
      
      await processPayment.mutateAsync({
        orderId: parseInt(order.id),
        paymentMethodId: parseInt(selectedPaymentMethod),
        tipAmount: finalTipAmount,
        tipPercentage: tipMode === 'percentage' ? pendingPaymentData.tipPercentage : undefined,
        receivedAmount: 'receivedAmount' in pendingPaymentData ? pendingPaymentData.receivedAmount : undefined,
        notes: pendingPaymentData.notes
      })
      freeTable(order.table_id)
      clearInvoiceData()
      setShowConfirmDialog(false)
      setPendingPaymentData(null)
      onOpenChange(false)
    } catch (error) {
      console.error('Payment failed:', error)
      setShowConfirmDialog(false)
      setPendingPaymentData(null)
    }
  }

  const handlePrintInvoice = async () => {
    if (!order || !selectedPaymentMethod) return

    const selectedMethod = paymentMethods.find(pm => pm.id === parseInt(selectedPaymentMethod))
    if (!selectedMethod) return

    try {
      const finalTipAmount = tipMode === 'percentage' ? calculatedTipAmount : tipAmount
      
      // Guardar datos en localStorage antes de imprimir
      saveInvoiceData(
        order,
        selectedMethod,
        finalTipAmount,
        tipMode,
        tipMode === 'percentage' ? tipPercentage : undefined,
        receivedAmount,
        changeAmount,
        form.getValues('notes')
      )

      // Imprimir factura
      await printInvoice({
        order,
        paymentMethod: selectedMethod,
        tipAmount: finalTipAmount,
        tipPercentage: tipMode === 'percentage' ? tipPercentage : undefined,
        receivedAmount,
        changeAmount,
        notes: form.getValues('notes')
      })

      console.log('✅ Factura impresa y datos guardados en localStorage')
    } catch (error) {
      console.error('❌ Error al imprimir factura:', error)
    }
  }

  const handleTipModeChange = (mode: 'percentage' | 'amount') => {
    setTipMode(mode)
      form.setValue('tipPercentage', undefined)
      form.setValue('tipAmount', undefined)
  }

  const handleQuickTip = (percentage: number) => {
    setTipMode('percentage')
    form.setValue('tipPercentage', percentage)
    form.setValue('tipAmount', undefined)
  }

  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Procesar Pago - Mesa {order.table_number}
          </DialogTitle>
          <DialogDescription>
            Complete los detalles del pago para finalizar la orden
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              <div className="space-y-6">
              {/* Order Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Impuestos:</span>
                  <span>${order.tax_amount.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total Orden:</span>
                  <span>${orderAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Method */}
              <FormField
                control={form.control}
                name="paymentMethodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pago</FormLabel>
                    <Select
                      value={selectedPaymentMethod}
                      onValueChange={(value) => {
                        setSelectedPaymentMethod(value)
                        field.onChange(parseInt(value))
                      }}
                      disabled={loadingMethods}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder="Seleccionar método de pago" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id.toString()}>
                            {method.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tip Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Propina</Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant={tipMode === 'percentage' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleTipModeChange('percentage')}
                    >
                      %
                    </Button>
                    <Button
                      type="button"
                      variant={tipMode === 'amount' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleTipModeChange('amount')}
                    >
                      $
                    </Button>
                  </div>
                </div>

                {/* Quick tip buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {quickTipPercentages.map((percentage) => (
                    <Button
                      key={percentage}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickTip(percentage)}
                      className="flex-1"
                    >
                      {percentage}%
                    </Button>
                  ))}
                </div>

                {/* Tip input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tipMode === 'percentage' ? (
                    <FormField
                      control={form.control}
                      name="tipPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Porcentaje (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="tipAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monto ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="100"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <div className="space-y-2">
                    <Label>Monto Propina</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border bg-muted">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span className="font-medium">{calculatedTipAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cash payment specific fields */}
              {isCashPayment && (
                <div className="space-y-4 p-3 sm:p-4 bg-yellow-50 rounded-lg border">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Calculator className="h-4 w-4" />
                    <span className="font-medium">Pago en Efectivo</span>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="receivedAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monto Recibido ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="100"
                            placeholder="Ingrese el monto recibido"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {receivedAmount > 0 && (
                    <div className="space-y-2 p-3 bg-white rounded border">
                      <div className="flex justify-between text-sm">
                        <span>Total a Pagar:</span>
                        <span className="font-medium">${totalToPay.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Recibido:</span>
                        <span>${receivedAmount.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Vueltas:</span>
                        <span className={changeAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${changeAmount.toLocaleString()}
                        </span>
                      </div>
                      {changeAmount < 0 && (
                        <p className="text-sm text-red-600">
                          Falta: ${Math.abs(changeAmount).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Número de referencia, observaciones..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Summary */}
              <div className="space-y-2 p-4 bg-green-50 rounded-lg border">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <Receipt className="h-4 w-4" />
                  <span className="font-medium">Resumen de Pago</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Orden:</span>
                    <span>${orderAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Propina:</span>
                    <span>${calculatedTipAmount.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total Final:</span>
                    <span>${totalToPay.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              </div>
            </div>

            {/* Footer flotante */}
            <div className="sticky bottom-0 bg-background border-t px-6 py-4 mt-auto">
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrintInvoice}
                  disabled={!selectedPaymentMethod || isPrintingInvoice}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Printer className="h-4 w-4" />
                  {isPrintingInvoice ? 'Imprimiendo...' : 'Imprimir Factura'}
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedPaymentMethod || !form.formState.isValid || processPayment.isPending || (isCashPayment && changeAmount < 0)}
                  className="w-full sm:w-auto sm:min-w-[120px]"
                >
                  {processPayment.isPending ? (
                    'Procesando...'
                  ) : (
                    `Pagar $${totalToPay.toLocaleString()}`
                  )}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>

      {/* Modal de Confirmación de Pago */}
      <AlertDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Confirmar Pago"
        description={`¿Está seguro que desea procesar el pago de $${totalToPay.toLocaleString()} para la Mesa ${order?.table_number}?`}
        variant="warning"
        confirmText={`Confirmar Pago $${totalToPay.toLocaleString()}`}
        cancelText="Cancelar"
        onConfirm={handleConfirmPayment}
        loading={processPayment.isPending}
      />
    </Dialog>
  )
}