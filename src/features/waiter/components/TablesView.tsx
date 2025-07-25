import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { useTables } from '../hooks/useTables'
import { Users, Clock, Search } from 'lucide-react'
import { useState, useMemo } from 'react'

export default function TablesView() {
  const { data: tables, isLoading, error } = useTables()
  const [searchTerm, setSearchTerm] = useState('')

  // Filtrar mesas basado en el término de búsqueda
  const filteredTables = useMemo(() => {
    if (!tables || !searchTerm.trim()) return tables
    
    return tables.filter(table => 
      table.number.toString().includes(searchTerm.trim()) ||
      table.capacity.toString().includes(searchTerm.trim())
    )
  }, [tables, searchTerm])

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
          {filteredTables.map((table) => (
            <Card 
              key={table.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>Mesa {table.number}</span>
                  <Badge variant="outline" className="text-xs">
                    Disponible
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Capacidad: {table.capacity} personas</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <Clock className="h-4 w-4" />
                  <span>Libre</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}