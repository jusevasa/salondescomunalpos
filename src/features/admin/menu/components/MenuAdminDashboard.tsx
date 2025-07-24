import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChefHat, 
  Coffee, 
  Utensils, 
  Printer, 
  BarChart3, 
  TrendingUp,
  Package,
  FileSpreadsheet
} from 'lucide-react'
import { useMenuStats } from '../hooks'
import MenuCategoriesTable from './MenuCategoriesTable'
import MenuItemsTable from './MenuItemsTable'
import SidesTable from './SidesTable'
import CookingPointsTable from './CookingPointsTable'
import PrintStationsTable from './PrintStationsTable'
import ExcelManager from './ExcelManager'

export default function MenuAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showExcelManager, setShowExcelManager] = useState(false)
  
  const { data: stats } = useMenuStats()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const StatCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    trend 
  }: {
    title: string
    value: string | number
    description: string
    icon: React.ComponentType<{ className?: string }>
    trend?: { value: number; isPositive: boolean }
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp className={`h-3 w-3 mr-1 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-xs ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const TabButton = ({ 
    id, 
    label, 
    icon: Icon, 
    isActive 
  }: { 
    id: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    isActive: boolean 
  }) => (
    <Button
      variant={isActive ? "default" : "outline"}
      onClick={() => setActiveTab(id)}
      className="gap-2"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administración de Menú</h1>
          <p className="text-muted-foreground">
            Gestiona categorías, items, acompañamientos y configuraciones del menú
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowExcelManager(true)}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Gestión Excel
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        <TabButton
          id="overview"
          label="Resumen"
          icon={BarChart3}
          isActive={activeTab === 'overview'}
        />
        <TabButton
          id="categories"
          label="Categorías"
          icon={Package}
          isActive={activeTab === 'categories'}
        />
        <TabButton
          id="items"
          label="Items"
          icon={Utensils}
          isActive={activeTab === 'items'}
        />
        <TabButton
          id="sides"
          label="Acompañamientos"
          icon={Coffee}
          isActive={activeTab === 'sides'}
        />
        <TabButton
          id="cooking-points"
          label="Puntos de Cocción"
          icon={ChefHat}
          isActive={activeTab === 'cooking-points'}
        />
        <TabButton
          id="print-stations"
          label="Estaciones"
          icon={Printer}
          isActive={activeTab === 'print-stations'}
        />
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Categorías"
              value={stats?.total_categories || 0}
              description={`${stats?.active_categories || 0} activas`}
              icon={Package}
            />
            <StatCard
              title="Total Items"
              value={stats?.total_items || 0}
              description={`${stats?.active_items || 0} activos`}
              icon={Utensils}
            />
            <StatCard
              title="Acompañamientos"
              value={stats?.total_sides || 0}
              description="Disponibles"
              icon={Coffee}
            />
            <StatCard
              title="Puntos de Cocción"
              value={stats?.total_cooking_points || 0}
              description="Configurados"
              icon={ChefHat}
            />
          </div>

          {/* Price Range Card */}
          {stats?.price_range && (
            <Card>
              <CardHeader>
                <CardTitle>Rango de Precios</CardTitle>
                <CardDescription>
                  Análisis de precios del menú
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.price_range.min)}
                    </div>
                    <p className="text-sm text-muted-foreground">Precio Mínimo</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(stats.price_range.avg)}
                    </div>
                    <p className="text-sm text-muted-foreground">Precio Promedio</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(stats.price_range.max)}
                    </div>
                    <p className="text-sm text-muted-foreground">Precio Máximo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Items by Category */}
          {stats?.items_by_category && stats.items_by_category.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Items por Categoría</CardTitle>
                <CardDescription>
                  Distribución de items en el menú
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.items_by_category.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{category.category_name}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">{category.count} items</div>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${(category.count / Math.max(...stats.items_by_category.map(c => c.count))) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tab Content for other sections */}
      {activeTab === 'categories' && <MenuCategoriesTable />}
      {activeTab === 'items' && <MenuItemsTable />}
      {activeTab === 'sides' && <SidesTable />}
      {activeTab === 'cooking-points' && <CookingPointsTable />}
      {activeTab === 'print-stations' && <PrintStationsTable />}

      {/* Excel Manager Modal */}
      {showExcelManager && (
        <ExcelManager onClose={() => setShowExcelManager(false)} />
      )}
    </div>
  )
}