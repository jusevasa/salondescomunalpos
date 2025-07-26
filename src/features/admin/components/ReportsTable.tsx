import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CalendarIcon, TrendingUpIcon, DollarSignIcon, PieChartIcon, ReceiptIcon, ClockIcon } from 'lucide-react'
import { useSalesReport, usePaidOrders } from '../hooks'
import { formatCurrency } from '@/lib/utils'
import type { ReportsFilters } from '../types'

export default function ReportsTable() {
  const today = new Date()
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0')

  const [filters, setFilters] = useState<ReportsFilters>({
    date_from: todayStr,
    date_to: todayStr
  })

  const { data: reportData, isLoading, error } = useSalesReport(filters)
  const { data: paidOrders, isLoading: isLoadingOrders, error: ordersError } = usePaidOrders(filters)

  const handleDateChange = (field: keyof ReportsFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const resetToToday = () => {
    setFilters({
      date_from: todayStr,
      date_to: todayStr
    })
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error al cargar los reportes: {error instanceof Error ? error.message : 'Error desconocido'}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros de fecha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Filtros de Reportes
          </CardTitle>
          <CardDescription>
            Selecciona el rango de fechas para generar el reporte de ventas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="date_from">Fecha desde</Label>
              <Input
                id="date_from"
                type="date"
                value={filters.date_from}
                onChange={(e) => handleDateChange('date_from', e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="date_to">Fecha hasta</Label>
              <Input
                id="date_to"
                type="date"
                value={filters.date_to}
                onChange={(e) => handleDateChange('date_to', e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={resetToToday}
              className="whitespace-nowrap"
            >
              Hoy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métricas principales */}
      {reportData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
                <PieChartIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.total_categories_amount)}</div>
                <p className="text-xs text-muted-foreground">Sin propinas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Propinas</CardTitle>
                <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.total_tips)}</div>
                <p className="text-xs text-muted-foreground">Propinas recibidas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Recaudo</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.total_revenue)}</div>
                <p className="text-xs text-muted-foreground">Ingresos totales</p>
              </CardContent>
            </Card>
          </div>

          {/* Ventas por categoría */}
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Categoría</CardTitle>
              <CardDescription>
                Detalle de ventas por categoría de productos (sin propinas)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.categories_sales.length > 0 ? (
                <div className="space-y-4">
                  {reportData.categories_sales.map((category) => (
                    <div key={category.category_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{category.category_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {category.total_quantity} items vendidos • {category.items_count} órdenes
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{formatCurrency(category.total_amount)}</div>
                        <Badge variant="secondary">
                          {((category.total_amount / reportData.total_categories_amount) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay ventas en el período seleccionado
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ventas por autor */}
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Autor</CardTitle>
              <CardDescription>
                Detalle de ventas por autor con descuento de comisión
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.authors_sales.length > 0 ? (
                <div className="space-y-6">
                  {reportData.authors_sales.map((author, index) => (
                    <div key={`${author.author}-${index}`} className="border rounded-lg p-4">
                      {/* Header del autor */}
                      <div className="flex items-center justify-between mb-4 pb-3 border-b">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">{author.author}</h4>
                          <p className="text-sm text-muted-foreground">
                            {author.total_quantity} items vendidos • {author.items_count} órdenes
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-sm text-muted-foreground">Total Bruto</div>
                          <div className="font-bold text-lg">{formatCurrency(author.total_amount)}</div>
                          <div className="text-sm text-red-600">- {formatCurrency(author.total_commission)} (comisión)</div>
                          <div className="text-sm font-bold text-green-600 border-t pt-1">
                            = {formatCurrency(author.net_amount)} neto
                          </div>
                        </div>
                      </div>

                      {/* Detalle por categorías */}
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm text-muted-foreground mb-2">Detalle por categorías:</h5>
                        {author.categories.map((category, catIndex) => (
                          <div key={`${category.category_name}-${catIndex}`} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex-1">
                              <span className="font-medium">{category.category_name}</span>
                              <p className="text-xs text-muted-foreground">
                                {category.quantity} items • {category.items_count} órdenes
                              </p>
                            </div>
                            <div className="text-right text-sm">
                              <div>{formatCurrency(category.amount)}</div>
                              <div className="text-red-600">- {formatCurrency(category.commission)}</div>
                              <div className="font-medium text-green-600">
                                = {formatCurrency(category.amount - category.commission)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay ventas por autor en el período seleccionado
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Órdenes Pagadas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ReceiptIcon className="h-5 w-5" />
                Órdenes Pagadas
              </CardTitle>
              <CardDescription>
                Listado de todas las órdenes pagadas en el período seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Cargando órdenes...</p>
                </div>
              ) : ordersError ? (
                <div className="text-center py-8">
                  <p className="text-red-600">Error al cargar las órdenes</p>
                </div>
              ) : !paidOrders || paidOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ReceiptIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay órdenes pagadas en este período</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paidOrders.map((order: any) => (
                      <Card key={order.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-sm">Orden #{order.id}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <ClockIcon className="h-3 w-3" />
                                {new Date(order.created_at).toLocaleString('es-CO')}
                              </p>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Pagada
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Mesa:</span>
                              <span className="font-medium">
                                {order.tables ? `Mesa ${order.tables.id}` : 'N/A'}
                              </span>
                            </div>

                            <div className="flex justify-between text-sm">
                              <span>Mesero:</span>
                              <span className="font-medium">
                                {order.profiles.name || 'N/A'}
                              </span>
                            </div>

                            <div className="flex justify-between text-sm">
                              <span>Items:</span>
                              <span className="font-medium">
                                {order.order_items?.length || 0} productos
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Propina:</span>
                              <span className="font-medium">
                                {formatCurrency(order.tip_amount)}
                              </span>
                            </div>
                            <Separator className="my-2" />

                            <div className="flex justify-between font-semibold">
                              <span>Total:</span>
                              <span className="text-green-600">
                                {formatCurrency(order.grand_total)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total de órdenes:</span>
                      <span className="text-lg font-bold">{paidOrders.length}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-semibold">Valor total:</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(paidOrders.reduce((sum: number, order: any) => sum + order.total_amount, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
      <Separator className="my-6" />

      {/* Información del reporte */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground text-center">
            Reporte generado para el período: {filters.date_from} - {filters.date_to}
            {isLoading && " • Cargando..."}
          </div>
        </CardContent>
      </Card>



      {isLoading && !reportData && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Generando reporte...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}