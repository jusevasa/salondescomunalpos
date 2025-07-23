import { z } from 'zod'

export const paymentSchema = z.object({
  paymentMethodId: z.number().min(1, 'Debe seleccionar un método de pago'),
  tipPercentage: z.number().min(0).max(100).optional(),
  tipAmount: z.number().min(0).optional(),
  receivedAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.tipPercentage !== undefined && data.tipAmount !== undefined) {
    return false
  }
  return true
}, {
  message: 'No puede especificar tanto porcentaje como monto de propina',
  path: ['tipAmount']
})

export const cashPaymentSchema = paymentSchema.extend({
  receivedAmount: z.number().min(0, 'Debe especificar el monto recibido'),
}).refine((data) => {
  return data.receivedAmount !== undefined && data.receivedAmount > 0
}, {
  message: 'El monto recibido es requerido para pagos en efectivo',
  path: ['receivedAmount']
})

export type PaymentFormData = z.infer<typeof paymentSchema>
export type CashPaymentFormData = z.infer<typeof cashPaymentSchema> 