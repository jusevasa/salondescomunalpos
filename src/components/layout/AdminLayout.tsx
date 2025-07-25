import type { ReactNode } from 'react'
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
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface AdminLayoutProps {
  children: ReactNode
}

const menuItems = [
  {
    title: "Órdenes",
    url: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "Menú",
    url: "/admin/menu",
    icon: ChefHat,
  },
  {
    title: "Mesas",
    url: "/admin/tables",
    icon: Users,
  },
  {
    title: "Reportes",
    url: "/admin/reports",
    icon: BarChart3,
  },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation()
  const { user, signOut } = useAuth()

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
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={location.pathname === item.url}
                      >
                        <Link to={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
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