import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useOrders } from '../hooks/useOrders'
import { usePrintServices } from '@/features/shared/hooks/usePrintServices'
import { useInvoiceData, usePrintInvoiceFromPayment } from '@/features/admin/hooks'
import { useToast } from '@/components/ui/toast'
import { transformOrderToPrintRequest } from '@/features/shared/utils/printTransformers'
import { Clock, Users, DollarSign, Printer, Receipt } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { DatabaseOrder } from '@/features/shared/types/database'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-purple-100 text-purple-800',
} as const

const statusLabels = {
  pending: 'Pendiente',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
} as const

export default function OrdersView() {
  const { data: orders, isLoading, error } = useOrders()
  const { printOrder, isPrintingOrder, isServiceAvailable } = usePrintServices()
  const { hasInvoiceDataForOrder, getInvoiceDataForOrder, clearInvoiceData } = useInvoiceData()
  const { printInvoiceFromStoredData, isPrinting: isPrintingInvoice } = usePrintInvoiceFromPayment()
  const { addToast } = useToast()

  const handlePrintOrder = async (order: any) => {
    if (!isServiceAvailable) {
      addToast({
        title: 'Servicio no disponible',
        description: 'El servicio de impresión no está disponible',
        variant: 'error'
      })
      return
    }

    try {
      // Convert Order to DatabaseOrder format
      const databaseOrder: DatabaseOrder = {
        id: order.id,
        table_id: order.table_id,
        profile_id: order.profile_id,
        diners_count: order.diners_count,
        status: order.status,
        subtotal: order.subtotal,
        tax_amount: order.tax_amount || 0,
        total_amount: order.total_amount,
        tip_amount: order.tip_amount || 0,
        grand_total: order.grand_total,
        paid_amount: order.paid_amount || 0,
        change_amount: order.change_amount || 0,
        notes: order.notes,
        created_at: order.created_at,
        updated_at: order.updated_at,
        tables: order.table ? {
          id: order.table.id,
          number: order.table.number,
          capacity: order.table.capacity,
          active: order.table.active,
          created_at: order.table.created_at,
          updated_at: order.table.updated_at
        } : undefined,
        order_items: order.order_items || []
      }

      const printRequest = transformOrderToPrintRequest(databaseOrder)
      await printOrder(printRequest)
      
      addToast({
        title: 'Orden impresa',
        description: `Orden #${order.id} enviada a impresión`,
        variant: 'success'
      })
    } catch (error) {
      console.error('Error printing order:', error)
      addToast({
        title: 'Error al imprimir',
        description: 'Hubo un problema al imprimir la orden',
        variant: 'error'
      })
    }
  }

  const handlePrintInvoice = async (orderId: string) => {
    try {
      // Obtener datos de factura guardados para esta orden
      const invoiceData = getInvoiceDataForOrder(orderId)
      
      if (!invoiceData) {
        addToast({
          title: 'Sin datos de factura',
          description: 'No se encontraron datos de pago guardados para esta orden',
          variant: 'error'
        })
        return
      }

      // Imprimir factura usando los datos guardados
      await printInvoiceFromStoredData(invoiceData)
      
      addToast({
        title: 'Factura impresa',
        description: `Factura de la orden #${orderId} enviada a impresión`,
        variant: 'success'
      })
      
      // Limpiar datos después de imprimir exitosamente
      clearInvoiceData()
    } catch (error) {
      console.error('Error printing invoice:', error)
      addToast({
        title: 'Error al imprimir factura',
        description: 'Hubo un problema al imprimir la factura',
        variant: 'error'
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error al cargar las órdenes</p>
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No hay órdenes activas</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Órdenes</h2>
        <Badge variant="secondary" className="text-sm">
          {orders.length} órdenes activas
        </Badge>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span>Orden #{order.id}</span>
                  <Badge 
                    className={statusColors[order.status as keyof typeof statusColors]}
                  >
                    {statusLabels[order.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Mesa {order.table?.number}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePrintOrder(order)}
                      disabled={!isServiceAvailable || isPrintingOrder}
                      className="h-8 w-8 p-0"
                      title="Imprimir orden"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    {hasInvoiceDataForOrder(order.id.toString()) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintInvoice(order.id.toString())}
                        disabled={isPrintingInvoice}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        title="Imprimir factura (datos guardados)"
                      >
                        <Receipt className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{order.diners_count} comensales</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(order.created_at).toLocaleTimeString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
              {order.notes && (
                <div className="mt-3 p-2 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}