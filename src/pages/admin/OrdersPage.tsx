import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OrdersTable, useOrders, useOrdersSubscription } from '@/features/admin'
import { formatCurrency } from '@/lib/utils'
import type { OrderFilters } from '@/features/admin'

type OrderViewType = 'active' | 'paid' | 'cancelled'

export default function AdminOrdersPage() {
  const [filters] = useState<OrderFilters>({})
  const [activeTab, setActiveTab] = useState<OrderViewType>('active')
  const { data: ordersData, isLoading, error } = useOrders(filters)

  useOrdersSubscription()

  // Filtrar órdenes por estado
  const allOrders = ordersData?.orders || []
  const activeOrders = allOrders.filter(order => 
    order.status !== 'paid' && order.status !== 'cancelled'
  )
  const paidOrders = allOrders.filter(order => order.status === 'paid')
  const cancelledOrders = allOrders.filter(order => order.status === 'cancelled')
  
  // Estadísticas
  const pendingOrders = activeOrders.filter(order => order.payment_status === 'pending')
  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total_amount, 0)
  const cancelledRevenue = cancelledOrders.reduce((sum, order) => sum + order.total_amount, 0)

  // Obtener las órdenes a mostrar según la pestaña activa
  const getCurrentOrders = () => {
    switch (activeTab) {
      case 'active':
        return activeOrders
      case 'paid':
        return paidOrders
      case 'cancelled':
        return cancelledOrders
      default:
        return activeOrders
    }
  }

  const currentOrders = getCurrentOrders()

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
            Gestiona las órdenes activas, pagadas y canceladas
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Órdenes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              órdenes registradas hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {activeOrders.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingOrders.length} pendientes de pago
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
              Canceladas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {cancelledOrders.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(cancelledRevenue)} perdidos
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
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              de órdenes pagadas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold">Órdenes</h2>
            <div className="flex items-center space-x-2">
              <Button
                variant={activeTab === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('active')}
                className="relative"
              >
                Activas
                {activeOrders.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeOrders.length}
                  </Badge>
                )}
              </Button>
              <Button
                variant={activeTab === 'paid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('paid')}
              >
                Pagadas
                {paidOrders.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {paidOrders.length}
                  </Badge>
                )}
              </Button>
              <Button
                variant={activeTab === 'cancelled' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('cancelled')}
              >
                Canceladas
                {cancelledOrders.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {cancelledOrders.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{currentOrders.length} órdenes</Badge>
            {isLoading && (
              <Badge variant="secondary">Actualizando...</Badge>
            )}
          </div>
        </div>

        <OrdersTable orders={currentOrders} isLoading={isLoading} />
      </div>
    </div>
  )
}