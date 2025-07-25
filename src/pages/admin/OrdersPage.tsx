import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OrdersTable, useOrders, useOrdersSubscription } from '@/features/admin'
import type { OrderFilters } from '@/features/admin'

export default function AdminOrdersPage() {
  const [filters, setFilters] = useState<OrderFilters>({})
  const { data: ordersData, isLoading, error } = useOrders(filters)

  useOrdersSubscription()

  const orders = ordersData?.orders.filter(order => order.payment_status != 'paid') || []
  const pendingOrders = orders.filter(order => order.payment_status === 'pending')
  const paidOrders = orders.filter(order => order.payment_status === 'paid')
  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total_amount, 0)


  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error al cargar órdenes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Error desconocido'}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Recargar página
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Órdenes del Día
          </h1>
          <p className="text-muted-foreground">
            Gestiona las órdenes y pagos pendientes
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Órdenes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              órdenes registradas hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendientes de Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {pendingOrders.length}
            </div>
            <p className="text-xs text-muted-foreground">
              requieren atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pagadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {paidOrders.length}
            </div>
            <p className="text-xs text-muted-foreground">
              completadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos del Día
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              de órdenes pagadas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Órdenes Activas</h2>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{orders.length} órdenes</Badge>
            {isLoading && (
              <Badge variant="secondary">Actualizando...</Badge>
            )}
          </div>
        </div>

        <OrdersTable orders={orders} isLoading={isLoading} />
      </div>
    </div>
  )
} 