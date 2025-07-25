import { useParams, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useTables } from '@/features/waiter/hooks/useTables'
import CreateOrderForm from '../../features/waiter/components/CreateOrderForm'

export default function CreateOrderPage() {
  const { tableId } = useParams<{ tableId: string }>()
  const navigate = useNavigate()
  const { data: tables } = useTables()

  const table = tables?.find(t => t.id === parseInt(tableId || '0'))

  if (!table) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Mesa no encontrada</h1>
          <Button onClick={() => navigate('/waiter')}>
            Volver a Mesas
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/waiter')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nueva Orden</h1>
          <p className="text-muted-foreground">Mesa {table.number} - Capacidad: {table.capacity} personas</p>
        </div>
      </div>

      <CreateOrderForm 
        table={table} 
        onSuccess={() => navigate('/waiter')}
        onCancel={() => navigate('/waiter')}
      />
    </div>
  )
}