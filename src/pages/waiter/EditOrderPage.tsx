import { useParams, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import EditOrderForm from '../../features/waiter/components/EditOrderForm'
import { useOrderById } from '@/features/waiter/hooks/useOrderById'

export default function EditOrderPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const numericOrderId = orderId ? parseInt(orderId) : 0
  const { data: order } = useOrderById(numericOrderId)

  if (!orderId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-muted-foreground">ID de orden no válido</p>
          <Button onClick={() => navigate('/waiter')} className="mt-4">
            Volver a Mesas
          </Button>
        </div>
      </div>
    )
  }

  const handleSuccess = () => {
    navigate('/waiter')
  }

  const handleCancel = () => {
    navigate('/waiter')
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate('/waiter')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Mesas
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Orden #{orderId}</h1>
          {order?.table && (
            <p className="text-muted-foreground">Mesa {order.table.number} - Capacidad: {order.table.capacity} personas</p>
          )}
        </div>
      </div>

      <EditOrderForm
        orderId={numericOrderId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}