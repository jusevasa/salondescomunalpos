import { z } from 'zod'

export const changeTableSchema = z.object({
  newTableId: z.number({
    message: 'Debes seleccionar una mesa'
  }).int('Debe seleccionar una mesa válida').positive('Debe seleccionar una mesa válida'),
})

export type ChangeTableFormData = z.infer<typeof changeTableSchema>
