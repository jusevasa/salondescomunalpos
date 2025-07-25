import { Button } from '@/components/ui/button'
import { useOrderManagement } from '../hooks/useOrderManagement'
import type { Order } from '../types'

interface OrderActionsExampleProps {
  order: Order
}

/**
 * Componente de ejemplo que muestra cómo usar las funciones del hook useOrderManagement
 * para manejar el estado de las mesas al finalizar órdenes
 */
export default function OrderActionsExample({ order }: OrderActionsExampleProps) {
  const { completeOrder } = useOrderManagement()

  const handleCompleteOrder = async (status: 'paid' | 'cancelled') => {
    try {
      await completeOrder.mutateAsync({
        orderId: order.id,
        status
      })
      
      console.log(`✅ Orden ${status === 'paid' ? 'pagada' : 'cancelada'} y mesa liberada`)
    } catch (error) {
      console.error('❌ Error al finalizar orden:', error)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleCompleteOrder('paid')}
        disabled={completeOrder.isPending}
        variant="default"
      >
        {completeOrder.isPending ? 'Procesando...' : 'Marcar como Pagada'}
      </Button>
      
      <Button
        onClick={() => handleCompleteOrder('cancelled')}
        disabled={completeOrder.isPending}
        variant="destructive"
      >
        {completeOrder.isPending ? 'Procesando...' : 'Cancelar Orden'}
      </Button>
    </div>
  )
}

/**
 * NOTA: Este es un componente de ejemplo para mostrar cómo usar la función completeOrder.
 * 
 * En la práctica, la función completeOrder se puede usar en:
 * 
 * 1. PaymentDialog (ya integrado automáticamente en el servicio processPayment)
 * 2. Componentes de gestión de órdenes donde se necesite cancelar una orden
 * 3. Cualquier lugar donde se necesite finalizar una orden y liberar la mesa
 * 
 * La función completeOrder:
 * - Actualiza el estado de la orden en la base de datos
 * - Libera automáticamente la mesa asociada (status = true)
 * - Invalida las queries de React Query para actualizar la UI
 */