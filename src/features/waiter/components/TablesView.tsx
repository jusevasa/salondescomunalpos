import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { useTables } from '../hooks/useTables'
import { useOrders } from '../hooks/useOrders'
import { usePrintServices } from '@/features/shared/hooks/usePrintServices'
import { useToast } from '@/components/ui/toast'
import { transformOrderToPrintRequest } from '@/features/shared/utils/printTransformers'
import { Users, Clock, Search, ShoppingCart, Printer } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import type { Table } from '../types'
import type { DatabaseOrder } from '@/features/shared/types/database'

export default function TablesView() {
  const { data: tables, isLoading, error } = useTables()
  const { data: orders } = useOrders()
  const { printOrder, isPrintingOrder, isServiceAvailable } = usePrintServices()
  const { addToast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  const handlePrintOrder = async (order: any, event: React.MouseEvent) => {
    event.stopPropagation() // Evitar que se active el clic de la tarjeta
    
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

  // Filtrar mesas basado en el término de búsqueda
  const filteredTables = useMemo(() => {
    if (!tables || !searchTerm.trim()) return tables
    
    return tables.filter(table => 
      table.number.toString().includes(searchTerm.trim()) ||
      table.capacity.toString().includes(searchTerm.trim())
    )
  }, [tables, searchTerm])

  // Función para obtener el estado de una mesa
  const getTableStatus = (tableId: number) => {
    if (!orders) return { status: 'available', order: null }
    
    const activeOrder = orders.find(order => 
      order.table_id === tableId && 
      order.status !== 'paid' && 
      order.status !== 'cancelled'
    )
    
    if (activeOrder) {
      return { status: 'occupied', order: activeOrder }
    }
    
    return { status: 'available', order: null }
  }

  // Función para manejar el clic en una mesa
  const handleTableClick = (table: Table) => {
    const tableStatus = getTableStatus(table.id)
    
    if (tableStatus.status === 'occupied' && tableStatus.order) {
      // Si la mesa está ocupada, navegar a editar orden
      navigate(`/waiter/edit-order/${tableStatus.order.id}`)
    } else {
      // Si la mesa está libre, navegar a crear orden
      navigate(`/waiter/create-order/${table.id}`)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error al cargar las mesas</p>
      </div>
    )
  }

  if (!tables || tables.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No hay mesas disponibles</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Mesas</h2>
        <Badge variant="secondary" className="text-sm">
          {filteredTables?.length || 0} de {tables.length} mesas
        </Badge>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número de mesa o capacidad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Mostrar mensaje si no hay resultados de búsqueda */}
      {searchTerm.trim() && (!filteredTables || filteredTables.length === 0) && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No se encontraron mesas que coincidan con "{searchTerm}"
          </p>
        </div>
      )}

      {/* Grid de mesas */}
      {filteredTables && filteredTables.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const tableStatus = getTableStatus(table.id)
            const isOccupied = tableStatus.status === 'occupied'
            
            return (
              <Card 
                key={table.id} 
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  isOccupied ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'
                }`}
                onClick={() => handleTableClick(table)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span>Mesa {table.number}</span>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={isOccupied ? "destructive" : "outline"} 
                        className="text-xs"
                      >
                        {isOccupied ? 'Ocupada' : 'Disponible'}
                      </Badge>
                      {isOccupied && tableStatus.order && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handlePrintOrder(tableStatus.order, e)}
                          disabled={!isServiceAvailable || isPrintingOrder}
                          className="h-6 w-6 p-0"
                        >
                          <Printer className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Capacidad: {table.capacity} personas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    {isOccupied ? (
                      <>
                        <ShoppingCart className="h-4 w-4" />
                        <span>Orden #{tableStatus.order?.id}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4" />
                        <span>Libre</span>
                      </>
                    )}
                  </div>
                  {isOccupied && tableStatus.order && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {tableStatus.order.diners_count} comensales
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

    </div>
  )
}