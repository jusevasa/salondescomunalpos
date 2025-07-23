import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ProtectedRoute from '@/router/guards/ProtectedRoute'
import AdminLayout from '@/components/layout/AdminLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import UnauthorizedPage from '@/pages/UnauthorizedPage'
import AdminOrdersPage from '@/pages/AdminOrdersPage'
import AdminDashboardPage from '@/pages/AdminDashboardPage'
import AdminMenuPage from '@/pages/AdminMenuPage'
import AdminTablesPage from '@/pages/AdminTablesPage'
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
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout>
          <AdminDashboardPage />
        </AdminLayout>
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
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ToastProvider>
  </StrictMode>
)
