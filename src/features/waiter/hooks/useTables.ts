import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/config/supabase'
import type { Table } from '../types'

export const useTables = () => {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['tables'],
    queryFn: async (): Promise<Table[]> => {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('active', true)
        .order('id')

      if (error) throw error
      return data || []
    },
  })

  // Configurar canal de tiempo real para las mesas
  useEffect(() => {
    const channel = supabase
      .channel('tables-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
        },
        (payload) => {
          console.log('Table change received:', payload)
          // Invalidar y refrescar la query de mesas
          queryClient.invalidateQueries({ queryKey: ['tables'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return query
}