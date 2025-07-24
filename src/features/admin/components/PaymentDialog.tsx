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
import { Calculator, CreditCard, DollarSign, Receipt } from 'lucide-react'
import { usePaymentMethods, useProcessPayment } from '../hooks'
import { paymentSchema, cashPaymentSchema } from '@/lib/validations/payment'
import type { PaymentFormData, CashPaymentFormData } from '@/lib/validations/payment'
import type { Order } from '../types'

interface PaymentDialogProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function PaymentDialog({ order, open, onOpenChange }: PaymentDialogProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [tipMode, setTipMode] = useState<'percentage' | 'amount'>('percentage')
  
  const { data: paymentMethods = [], isLoading: loadingMethods } = usePaymentMethods()
  const processPayment = useProcessPayment()
  
  const isCashPayment = paymentMethods.find(pm => pm.id === parseInt(selectedPaymentMethod))?.code === 'CASH'
  const schema = isCashPayment ? cashPaymentSchema : paymentSchema
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid }
  } = useForm<PaymentFormData | CashPaymentFormData>({
    resolver: zodResolver(schema),
    mode: 'onChange'
  })

  const watchedValues = watch()
  
  // Calculate totals
  const orderAmount = order?.total_amount || 0
  const subtotalAmount = order?.subtotal || 0
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
      reset()
      setSelectedPaymentMethod('')
      setTipMode('percentage')
    }
  }, [open, order, reset])

  const onSubmit = async (data: PaymentFormData | CashPaymentFormData) => {
    if (!order) return

    try {
      const finalTipAmount = tipMode === 'percentage' ? calculatedTipAmount : data.tipAmount
      
      await processPayment.mutateAsync({
        orderId: parseInt(order.id),
        paymentMethodId: parseInt(selectedPaymentMethod),
        tipAmount: finalTipAmount,
        tipPercentage: tipMode === 'percentage' ? data.tipPercentage : undefined,
        receivedAmount: 'receivedAmount' in data ? data.receivedAmount : undefined,
        notes: data.notes
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Payment failed:', error)
    }
  }

  const handleTipModeChange = (mode: 'percentage' | 'amount') => {
    setTipMode(mode)
    setValue('tipPercentage', 0)
    setValue('tipAmount', 0)
  }

  const handleQuickTip = (percentage: number) => {
    setTipMode('percentage')
    setValue('tipPercentage', percentage)
  }

  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Procesar Pago - Mesa {order.table_number}
          </DialogTitle>
          <DialogDescription>
            Complete los detalles del pago para finalizar la orden
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 -mr-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          <div className="space-y-2 w-full">
            <Label htmlFor="paymentMethod">Método de Pago</Label>
            <Select
              value={selectedPaymentMethod}
              onValueChange={setSelectedPaymentMethod}
              disabled={loadingMethods}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar método de pago" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id.toString()}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.paymentMethodId && (
              <p className="text-sm text-destructive">{errors.paymentMethodId.message}</p>
            )}
          </div>

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
                <div className="space-y-2">
                  <Label htmlFor="tipPercentage">Porcentaje (%)</Label>
                  <Input
                    id="tipPercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    {...register('tipPercentage', { valueAsNumber: true })}
                  />
                  {errors.tipPercentage && (
                    <p className="text-sm text-destructive">{errors.tipPercentage.message}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="tipAmount">Monto ($)</Label>
                  <Input
                    id="tipAmount"
                    type="number"
                    min="0"
                    step="100"
                    {...register('tipAmount', { valueAsNumber: true })}
                  />
                  {errors.tipAmount && (
                    <p className="text-sm text-destructive">{errors.tipAmount.message}</p>
                  )}
                </div>
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
              
              <div className="space-y-2">
                <Label htmlFor="receivedAmount">Monto Recibido ($)</Label>
                <Input
                  id="receivedAmount"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="Ingrese el monto recibido"
                  {...register('receivedAmount', { valueAsNumber: true })}
                />
                {errors.receivedAmount && (
                  <p className="text-sm text-destructive">{errors.receivedAmount.message}</p>
                )}
              </div>

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
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Input
              id="notes"
              placeholder="Número de referencia, observaciones..."
              {...register('notes')}
            />
          </div>

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
          </form>
        </div>

        <div className="border-t pt-4 mt-4">
          <form onSubmit={handleSubmit(onSubmit)}>
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
                type="submit"
                disabled={!selectedPaymentMethod || !isValid || processPayment.isPending || (isCashPayment && changeAmount < 0)}
                className="w-full sm:w-auto sm:min-w-[120px]"
              >
                {processPayment.isPending ? (
                  'Procesando...'
                ) : (
                  `Pagar $${totalToPay.toLocaleString()}`
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}