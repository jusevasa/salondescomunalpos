import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CalendarIcon, TrendingUpIcon, DollarSignIcon, PieChartIcon, UsersIcon } from 'lucide-react'
import { useSalesReport } from '../hooks'
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Categorías</CardTitle>
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categorías Activas</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.categories_sales.length}</div>
                <p className="text-xs text-muted-foreground">Con ventas</p>
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
              <CardTitle>Detalle de Ventas por Autor</CardTitle>
              <CardDescription>
                Ventas detalladas por autor y categoría (sin propinas)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.authors_sales.length > 0 ? (
                <div className="space-y-4">
                  {reportData.authors_sales.map((author, index) => (
                    <div key={`${author.author}-${author.category_name}-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{author.author}</h4>
                        <p className="text-sm text-muted-foreground">
                          {author.category_name} • {author.total_quantity} items • {author.items_count} órdenes
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(author.total_amount)}</div>
                        <Badge variant="outline">
                          {((author.total_amount / reportData.total_categories_amount) * 100).toFixed(1)}%
                        </Badge>
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

          {/* Información del reporte */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground text-center">
                Reporte generado para el período: {filters.date_from} - {filters.date_to}
                {isLoading && " • Cargando..."}
              </div>
            </CardContent>
          </Card>
        </>
      )}

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