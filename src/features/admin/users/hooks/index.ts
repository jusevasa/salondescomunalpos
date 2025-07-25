import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersService } from '../services'
import type { CreateUserRequest, UpdateUserRequest, UserFilters } from '../types'

const USERS_QUERY_KEY = 'users'

export const useUsers = (filters?: UserFilters) => {
  return useQuery({
    queryKey: [USERS_QUERY_KEY, filters],
    queryFn: () => usersService.getUsers(filters),
  })
}

export const useUser = (id: string) => {
  return useQuery({
    queryKey: [USERS_QUERY_KEY, id],
    queryFn: () => usersService.getUserById(id),
    enabled: !!id,
  })
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateUserRequest) => usersService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] })
    },
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateUserRequest) => usersService.updateUser(data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] })
      queryClient.setQueryData([USERS_QUERY_KEY, updatedUser.id], updatedUser)
    },
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => usersService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] })
    },
  })
}

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => usersService.toggleUserStatus(id),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] })
      queryClient.setQueryData([USERS_QUERY_KEY, updatedUser.id], updatedUser)
    },
  })
}