import { supabase, getSupabaseAdmin } from '@/lib/config/supabase'
import type { User, CreateUserRequest, UpdateUserRequest, UserFilters, UsersResponse } from '../types'

export const usersService = {
  async createUser({ name, email, password, role }: CreateUserRequest): Promise<User> {
    const adminClient = getSupabaseAdmin()
    
    if (!adminClient) {
      throw new Error('Admin client not available. Please configure VITE_SUPABASE_SERVICE_ROLE_KEY.')
    }

    // Crear usuario en auth usando el cliente admin
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Error al crear usuario')

    // Crear perfil usando el cliente admin
    const { data: profileData, error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: authData.user.id,
        name,
        email,
        role,
        active: true, // Por defecto activo
      })
      .select()
      .single()

    if (profileError) {
      // Si falla la creación del perfil, eliminar el usuario de auth
      await adminClient.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    return profileData
  },

  async getUsers(filters?: UserFilters): Promise<UsersResponse> {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    if (filters?.role) {
      query = query.eq('role', filters.role)
    }

    if (filters?.active !== undefined) {
      query = query.eq('active', filters.active)
    }

    const { data, error, count } = await query

    if (error) throw error

    return {
      users: data || [],
      total: count || 0,
      page: 1,
      limit: 50
    }
  },

  async getUserById(id: string): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async updateUser({ id, data }: UpdateUserRequest): Promise<User> {
    const { data: updatedData, error } = await supabase
      .from('profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updatedData
  },

  async deleteUser(id: string): Promise<void> {
    // Primero desactivar el perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ active: false })
      .eq('id', id)

    if (profileError) throw profileError

    // Opcionalmente, también eliminar de auth (comentado por seguridad)
    // const { error: authError } = await supabase.auth.admin.deleteUser(id)
    // if (authError) throw authError
  },

  async toggleUserStatus(id: string): Promise<User> {
    // Obtener estado actual
    const user = await this.getUserById(id)
    
    // Cambiar estado
    return this.updateUser({
      id,
      data: { active: !user.active }
    })
  }
}