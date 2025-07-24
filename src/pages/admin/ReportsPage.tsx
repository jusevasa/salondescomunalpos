import { ReportsTable } from '@/features/admin'

export default function AdminReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">
            Análisis de ventas y estadísticas del restaurante
          </p>
        </div>
      </div>
      <ReportsTable />
    </div>
  )
}