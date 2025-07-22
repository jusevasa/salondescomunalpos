import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const { user, profile, signOut } = useAuth()
  const { isAdmin, isWaiter } = useRole()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={handleSignOut} variant="outline">
            Cerrar Sesión
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Información del Usuario</CardTitle>
              <CardDescription>Detalles de tu cuenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <strong>Nombre:</strong> {profile?.name}
              </div>
              <div>
                <strong>Email:</strong> {profile?.email}
              </div>
              <div>
                <strong>Rol:</strong> {profile?.role}
              </div>
              <div>
                <strong>Estado:</strong> {profile?.active ? 'Activo' : 'Inactivo'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permisos</CardTitle>
              <CardDescription>Acciones disponibles según tu rol</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {isAdmin() && (
                  <div className="p-2 bg-green-100 rounded">
                    ✓ Administrador - Acceso completo al sistema
                  </div>
                )}
                {isWaiter() && (
                  <div className="p-2 bg-blue-100 rounded">
                    ✓ Mesero - Gestión de órdenes y pagos
                  </div>
                )}
                <div className="p-2 bg-gray-100 rounded">
                  ✓ Ver dashboard
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 