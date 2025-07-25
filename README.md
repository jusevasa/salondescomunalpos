# Salón de Comunal

Sistema de gestión de restaurante con autenticación basada en roles usando React 19 + TypeScript + Supabase.

## Características

- ✅ Autenticación con Supabase
- ✅ Gestión de sesiones persistentes
- ✅ Control de acceso basado en roles (admin/waiter)
- ✅ Rutas protegidas
- ✅ Formularios con React Hook Form + Zod
- ✅ UI moderna con shadcn/ui

## Configuración

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

> ⚠️ **Importante**: La `SERVICE_ROLE_KEY` tiene privilegios de administrador y es necesaria para operaciones como crear usuarios. Manténla segura y nunca la expongas en código del lado del cliente.

### 2. Base de Datos

Ejecuta el archivo `supabase_schema.sql` en tu proyecto de Supabase para crear:
- Tablas con Row Level Security (RLS)
- Roles de usuario (admin/waiter)
- Políticas de seguridad
- Datos iniciales

### 3. Instalación

```bash
pnpm install
pnpm dev
```

## Autenticación

### Roles de Usuario

- **Admin**: Acceso completo al sistema, gestión de usuarios, menú, configuración
- **Waiter**: Gestión de órdenes y pagos

### Rutas Protegidas

- `/` - Dashboard (requiere autenticación)
- `/dashboard` - Dashboard principal
- `/admin` - Panel de administrador (solo admin)
- `/login` - Página de inicio de sesión
- `/unauthorized` - Página de acceso denegado

### Uso de Hooks

```tsx
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'

function MyComponent() {
  const { user, profile, signOut } = useAuth()
  const { isAdmin, isWaiter, hasRole } = useRole()
  
  return (
    <div>
      {isAdmin() && <AdminPanel />}
      {isWaiter() && <WaiterTools />}
    </div>
  )
}
```

### Componente ProtectedRoute

```tsx
import ProtectedRoute from '@/router/guards/ProtectedRoute'

// Ruta que requiere autenticación
<ProtectedRoute>
  <MyComponent />
</ProtectedRoute>

// Ruta solo para administradores
<ProtectedRoute allowedRoles={['admin']}>
  <AdminComponent />
</ProtectedRoute>

// Ruta para admin y waiter
<ProtectedRoute allowedRoles={['admin', 'waiter']}>
  <RestaurantComponent />
</ProtectedRoute>
```

## Arquitectura

### Estructura de Features

```
src/features/auth/
├── components/     # LoginForm, etc.
├── hooks/         # Hooks específicos de auth
├── services/      # API calls de autenticación
├── types/         # Tipos TypeScript
└── index.ts       # Barrel exports
```

### Configuración Global

```
src/lib/
├── auth/          # AuthProvider, servicios
├── config/        # Configuración Supabase, env
└── validations/   # Esquemas Zod
```

## Stack Tecnológico

- **Frontend**: React 19 + TypeScript
- **Routing**: React Router v7
- **Estado**: Zustand + TanStack Query
- **UI**: Tailwind CSS + shadcn/ui
- **Formularios**: React Hook Form + Zod
- **Backend**: Supabase (Auth + Database)

## Scripts

```bash
pnpm dev      # Desarrollo
pnpm build    # Construcción
pnpm lint     # Linting
pnpm preview  # Vista previa
```
