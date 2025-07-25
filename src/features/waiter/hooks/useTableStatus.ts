import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/config/supabase'

export const useTableStatus = () => {
  const queryClient = useQueryClient()

  // Actualizar el estado de una mesa
  const updateTableStatus = useMutation({
    mutationFn: async ({ 
      tableId, 
      status 
    }: { 
      tableId: number
      status: boolean // true = disponible, false = ocupada
    }) => {
      const { data, error } = await supabase
        .from('tables')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', tableId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidar las queries relacionadas con mesas
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      queryClient.invalidateQueries({ queryKey: ['activeOrder'] })
    },
  })

  // Marcar mesa como ocupada
  const occupyTable = (tableId: number) => {
    return updateTableStatus.mutateAsync({ tableId, status: false })
  }

  // Marcar mesa como disponible
  const freeTable = (tableId: number) => {
    return updateTableStatus.mutateAsync({ tableId, status: true })
  }

  return {
    updateTableStatus,
    occupyTable,
    freeTable,
  }
}