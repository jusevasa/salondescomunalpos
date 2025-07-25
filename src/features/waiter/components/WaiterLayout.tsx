import type { ReactNode } from 'react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
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
  TableIcon, 
  ShoppingCart, 
  LogOut,
  ChefHat,
} from 'lucide-react'
import type { WaiterView } from '../types'
import TablesView from './TablesView'
import OrdersView from './OrdersView'

interface WaiterLayoutProps {
  children?: ReactNode
}

export default function WaiterLayout({ children }: WaiterLayoutProps) {
  const { user, signOut } = useAuth()
  const [currentView, setCurrentView] = useState<WaiterView>('tables')

  const handleLogout = () => {
    signOut()
  }

  const menuItems = [
    {
      id: 'tables' as WaiterView,
      title: 'Mesas',
      icon: TableIcon,
    },
    {
      id: 'orders' as WaiterView,
      title: 'Órdenes',
      icon: ShoppingCart,
    },
  ]

  const renderContent = () => {
    if (children) return children
    
    switch (currentView) {
      case 'tables':
        return <TablesView />
      case 'orders':
        return <OrdersView />
      default:
        return <TablesView />
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border">
            <div className="flex items-center gap-2 px-4 py-1.5">
              <ChefHat className="h-6 w-6" />
              <span className="font-semibold text-lg">Mesero</span>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navegación</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setCurrentView(item.id)}
                        isActive={currentView === item.id}
                        className="w-full"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
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
                {user?.email}
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
            <div className="flex h-14 items-center gap-4 px-4">
              <SidebarTrigger />
              <div className="flex-1" />
            </div>
          </header>
          
          <div className="flex-1 p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}