import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { useTables } from '../hooks/useTables'
import { useOrders } from '../hooks/useOrders'
import { Users, Clock, Search, ShoppingCart, } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import type { Table } from '../types'

export default function TablesView() {
  const { data: tables, isLoading, error } = useTables()
  const { data: orders } = useOrders()
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  const filteredTables = useMemo(() => {
    if (!tables || !searchTerm.trim()) return tables
    
    return tables.filter(table => 
      table.number.toString().includes(searchTerm.trim()) ||
      table.capacity.toString().includes(searchTerm.trim())
    )
  }, [tables, searchTerm])

  // Función para obtener el estado de una mesa
  const getTableStatus = (table: Table) => {
    // Usar el campo status de la tabla como fuente principal de verdad
    if (!table.status) {
      // Si status es false, la mesa está ocupada
      // Buscar la orden activa para mostrar información adicional
      const activeOrder = orders?.find(order => 
        order.table_id === table.id && 
        order.status !== 'paid' && 
        order.status !== 'cancelled'
      )
      return { status: 'occupied', order: activeOrder || null }
    }
    
    // Si status es true, la mesa está disponible
    return { status: 'available', order: null }
  }

  // Función para manejar el clic en una mesa
  const handleTableClick = (table: Table) => {
    const tableStatus = getTableStatus(table)
    
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
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 bg-background border-b p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Mesas</h2>
            <Badge variant="secondary" className="text-sm">
              Cargando...
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número de mesa o capacidad..."
              disabled
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 bg-background border-b p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Mesas</h2>
            <Badge variant="secondary" className="text-sm">
              Error
            </Badge>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-center py-8">
            <p className="text-destructive">Error al cargar las mesas</p>
          </div>
        </div>
      </div>
    )
  }

  if (!tables || tables.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 bg-background border-b p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Mesas</h2>
            <Badge variant="secondary" className="text-sm">
              0 mesas
            </Badge>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay mesas disponibles</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header fijo */}
      <div className="flex-shrink-0 bg-background border-b p-6 space-y-4">
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
      </div>

      {/* Área scrolleable para las mesas */}
      <div className="flex-1 overflow-y-auto p-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-6">
            {filteredTables.map((table) => {
              const tableStatus = getTableStatus(table)
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
    </div>
  )
}