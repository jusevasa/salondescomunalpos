import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminMenuPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Menú</h1>
        <p className="text-muted-foreground">
          Administra los elementos del menú del restaurante
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta funcionalidad estará disponible próximamente.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}