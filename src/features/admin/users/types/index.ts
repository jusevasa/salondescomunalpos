import type { UserRole, Profile } from '@/types/database'
import type { z } from 'zod'
import { userFormSchema, userUpdateSchema, userFiltersSchema } from '../validations'

export type User = Profile

export type UserFormData = z.infer<typeof userFormSchema>
export type UserUpdateData = z.infer<typeof userUpdateSchema>
export type UserFilters = z.infer<typeof userFiltersSchema>

export interface UsersResponse {
  users: User[]
  total: number
  page: number
  limit: number
}

export interface CreateUserRequest {
  name: string
  email: string
  password: string
  role: UserRole
}

export interface UpdateUserRequest {
  id: string
  data: UserUpdateData
}