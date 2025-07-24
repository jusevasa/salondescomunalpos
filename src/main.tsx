import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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
} from '@/pages'
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
    path: '/admin/reports',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout>
          <AdminReportsPage />
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
      </QueryClientProvider>
    </ToastProvider>
  </StrictMode>
)
