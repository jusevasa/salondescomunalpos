import { z } from 'zod'

export const userFormSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres'),
  email: z.string()
    .email('Ingresa un email válido')
    .max(255, 'El email no puede exceder 255 caracteres'),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres'),
  role: z.enum(['admin', 'waiter'], {
    message: 'Selecciona un rol'
  }),
  active: z.boolean().default(true)
})

export const userUpdateSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .optional(),
  email: z.string()
    .email('Ingresa un email válido')
    .max(255, 'El email no puede exceder 255 caracteres')
    .optional(),
  role: z.enum(['admin', 'waiter']).optional(),
  active: z.boolean().optional()
})

export const userFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['admin', 'waiter']).optional(),
  active: z.boolean().optional()
})