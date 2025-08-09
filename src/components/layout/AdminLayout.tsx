import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  ShoppingCart, 
  Users, 
  BarChart3, 
  LogOut,
  ChefHat,
  UserCog,
  Package,
  Utensils,
  Coffee,
  Printer,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface AdminLayoutProps {
  children: ReactNode
}

//

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation()
  const { user, signOut } = useAuth()

  const isMenuSectionActive = location.pathname.startsWith('/admin/menu')
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(isMenuSectionActive)

  useEffect(() => {
    setIsMenuOpen(isMenuSectionActive)
  }, [isMenuSectionActive])

  const handleLogout = () => {
    signOut()
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border">
            <div className="flex items-center gap-2 px-4 py-1.5">
              <ChefHat className="h-6 w-6" />
              <span className="font-semibold text-lg">Salóndescomunal</span>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Administración</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Órdenes */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname.startsWith('/admin/orders')}>
                      <Link to="/admin/orders">
                        <ShoppingCart className="h-4 w-4" />
                        <span>Órdenes</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Menú con subitems */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isMenuSectionActive}
                      onClick={() => setIsMenuOpen((v) => !v)}
                    >
                      <ChefHat className="h-4 w-4" />
                      <span>Menú</span>
                    </SidebarMenuButton>
                    {isMenuOpen && (
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={location.pathname === '/admin/menu/resumen'}>
                            <Link to="/admin/menu/resumen">
                              <BarChart3 className="h-4 w-4" />
                              <span>Resumen</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={location.pathname === '/admin/menu/categorias'}>
                            <Link to="/admin/menu/categorias">
                              <Package className="h-4 w-4" />
                              <span>Categorías</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={location.pathname === '/admin/menu/items'}>
                            <Link to="/admin/menu/items">
                              <Utensils className="h-4 w-4" />
                              <span>Items</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={location.pathname === '/admin/menu/acompanamientos'}>
                            <Link to="/admin/menu/acompanamientos">
                              <Coffee className="h-4 w-4" />
                              <span>Acompañamientos</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={location.pathname === '/admin/menu/puntos-de-coccion'}>
                            <Link to="/admin/menu/puntos-de-coccion">
                              <ChefHat className="h-4 w-4" />
                              <span>Puntos de Cocción</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={location.pathname === '/admin/menu/estaciones'}>
                            <Link to="/admin/menu/estaciones">
                              <Printer className="h-4 w-4" />
                              <span>Estaciones</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>

                  {/* Mesas */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname.startsWith('/admin/tables')}>
                      <Link to="/admin/tables">
                        <Users className="h-4 w-4" />
                        <span>Mesas</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Usuarios */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname.startsWith('/admin/users')}>
                      <Link to="/admin/users">
                        <UserCog className="h-4 w-4" />
                        <span>Usuarios</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Reportes */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname.startsWith('/admin/reports')}>
                      <Link to="/admin/reports">
                        <BarChart3 className="h-4 w-4" />
                        <span>Reportes</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border">
            <div className="p-4 space-y-2">
              <div className="text-sm text-muted-foreground">
                Conectado como: <span className="font-medium">{user?.email}</span>
              </div>
              <Separator />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="w-full justify-start"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4 lg:px-6">
              <SidebarTrigger className="mr-4" />
              <div className="flex-1" />
            </div>
          </header>
          
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}