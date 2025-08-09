import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from "@vercel/analytics/react"
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ProtectedRoute from '@/router/guards/ProtectedRoute'
import AdminLayout from '@/components/layout/AdminLayout'
import {
  LoginPage,
  UnauthorizedPage,
  AdminMenuPage,
  AdminOrdersPage,
  AdminTablesPage,
  AdminReportsPage,
  AdminUsersPage,
  WaiterPage,
} from '@/pages'
import CreateOrderPage from '@/pages/waiter/CreateOrderPage'
import EditOrderPage from '@/pages/waiter/EditOrderPage'
import './index.css'
import { ToastProvider } from './components/ui/toast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '/waiter',
    element: (
      <ProtectedRoute allowedRoles={['waiter', 'admin']}>
        <WaiterPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/waiter/create-order/:tableId',
    element: (
      <ProtectedRoute allowedRoles={['waiter', 'admin']}>
        <CreateOrderPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/waiter/edit-order/:orderId',
    element: (
      <ProtectedRoute allowedRoles={['waiter', 'admin']}>
        <EditOrderPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/orders',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout>
          <AdminOrdersPage />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/menu',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout>
          <AdminMenuPage />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/menu/:tab',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout>
          <AdminMenuPage />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/tables',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout>
          <AdminTablesPage />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/reports',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout>
          <AdminReportsPage />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout>
          <AdminUsersPage />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Analytics/>
      </QueryClientProvider>
    </ToastProvider>
  </StrictMode>
)
