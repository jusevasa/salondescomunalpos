# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Salón de Comunal** is a restaurant management system built with React 19 + TypeScript + Supabase. It features role-based authentication (admin/waiter), menu management, order processing, payments, and invoice printing via an external print service.

## Development Commands

```bash
# Development
pnpm dev          # Start dev server with Vite
pnpm build        # Type-check with tsc and build with Vite
pnpm lint         # Run ESLint
pnpm preview      # Preview production build
```

## Architecture

### Screaming Architecture (Feature-Based)

The codebase follows a feature-based structure where each domain is self-contained:

```
src/features/{feature}/
├── components/   # Domain-specific UI
├── hooks/        # Domain-specific hooks
├── services/     # Data access, business logic
├── types/        # Domain types
├── utils/        # Domain utilities
└── index.ts      # Barrel exports
```

**Core Features:**
- `auth`: Authentication with LoginForm, auth hooks, and guards
- `admin`: Order management, menu CRUD (categories, items, sides, cooking points, print stations), tables, users
- `waiter`: Order creation/editing, order confirmation with optional print
- `shared`: Print service, print hooks, transformers, contract validation

### Shared Infrastructure

```
src/lib/
├── auth/         # Zustand auth store, Supabase auth services
├── config/       # Environment variables, Supabase client
├── utils/        # Utilities (cn, currency/date formatting)
└── validations/  # Global Zod schemas
```

### Global Resources

```
src/components/   # Shared UI (ui/, layout/, common/)
src/hooks/        # Global hooks (useAuth, useRole, useSidebarPersistence)
src/pages/        # Page components per route
src/router/       # ProtectedRoute guard
src/types/        # Global types (auth.ts, database.ts)
```

## Tech Stack

- **Frontend**: React 19, TypeScript (strict mode), Vite
- **Routing**: React Router v7 (routes declared in `src/main.tsx`)
- **State Management**:
  - Server state: TanStack Query v5 (staleTime: 5min, retry: 1)
  - Client state: Zustand (auth store)
- **UI**: Tailwind CSS 4.0, shadcn/ui components in `src/components/ui`
- **Forms**: React Hook Form + Zod validation
- **Backend**: Supabase (Auth + PostgreSQL with Row Level Security)
- **Analytics**: Vercel Analytics

## Authentication & Authorization

### Auth Flow
1. **Auth Store**: Zustand store in `src/lib/auth/authStore.ts` manages session state
2. **Initialization**: Call `initializeAuth()` on app mount to restore session
3. **Hook**: `useAuth()` exposes `{ user, profile, isAuthenticated, signIn, signOut }`
4. **Role Check**: `useRole()` provides `{ isAdmin, isWaiter, hasRole }`

### Protected Routes
- Use `ProtectedRoute` component with `allowedRoles` prop
- Guards validate: session → role → active profile
- Redirects:
  - No session → `/login`
  - No role → `/unauthorized`
  - Inactive profile → `/account-disabled`

### User Roles
- `admin`: Full system access (menu, users, reports, all orders)
- `waiter`: Order and payment management only

## Database

### Key Tables & Relationships
- `profiles`: User profiles with roles (links to Supabase Auth)
- `menu_categories`, `menu_items`, `sides`, `cooking_points`, `print_stations`
- `item_sides`: Junction table for menu_items ↔ sides (max_quantity)
- `tables`: Restaurant tables (number, capacity, active)
- `orders`: Main order entity (status, totals, tax, tip, etc.)
- `order_items`: Line items (quantity, unit_price, cooking_point, notes)
- `order_item_sides`: Junction for order_items ↔ sides
- `payments`: Payment records (method, amounts, tip, change, reference)
- `payment_methods`: Available payment methods (CASH, NEQUI, DAVIPLATA, etc.)

### Database Types
- All types generated in `src/types/database.ts` from Supabase schema
- See `DATABASE_DOCUMENTATION.md` for detailed schemas, queries, and examples

### Row Level Security (RLS)
- All tables have RLS policies
- Admin role has full access
- Waiter role limited to orders and payments
- Use `auth.uid()` to identify current user

## Print Service

### Overview
External print API for order tickets and invoices configured via `VITE_PRINT_API_URL`.

### Service Location
`src/features/shared/services/printService.ts`

### Endpoints
- `POST /api/orders/print` - Print order ticket (kitchen comanda)
- `POST /api/orders/invoice` - Print invoice

### Error Handling
Throws `PrintServiceError` with codes:
- `MISSING_CONFIG`: Print URL not configured
- `HTTP_ERROR`: HTTP error response
- `NETWORK_ERROR`: Network failure
- `INVALID_CONTRACT`: Contract validation failed

### Contract Validation
Always validate contracts before sending:
- Use `validateBeforeSending(type, data)` from `features/shared/utils/contractValidation.ts`
- Transformers available:
  - `features/shared/utils/printTransformers.ts`
  - `features/admin/utils/invoiceTransformers.ts`

### Hooks
`features/shared/hooks/usePrintServices.ts`:
- `usePrintServiceHealth()`: Check print service availability
- `usePrintOrder()`: Print order mutation
- `usePrintInvoice()`: Print invoice mutation

## UI Components

### shadcn/ui Components
All UI components in `src/components/ui/`. Always use existing components before creating new ones:

**Forms**: Form, FormField, FormItem, FormLabel, FormControl, FormMessage
**Inputs**: Input, Select, Checkbox, DatePicker, Popover
**Overlays**: Dialog, AlertDialog, DropdownMenu, Tooltip
**Layout**: Sidebar (with SidebarProvider, persists to localStorage as `sidebar_state`)
**Data**: Table (with Header, Body, Row, Cell), Card
**Feedback**: Toast (useToast hook)

### AdminLayout
- Located in `src/components/layout/AdminLayout.tsx`
- Wraps admin pages with Sidebar navigation
- Uses SidebarTrigger for mobile menu

### Styling
- Tailwind CSS 4.0 with design tokens
- Use `cn()` utility from `src/lib/utils.ts` to merge classes
- Variants with `class-variance-authority` (cva) where appropriate

## Routing

### Route Structure
Declared in `src/main.tsx` using `createBrowserRouter`:

**Public**:
- `/login`, `/unauthorized`, `/account-disabled`

**Waiter**:
- `/waiter` - Order dashboard
- `/waiter/create-order/:tableId` - Create new order
- `/waiter/edit-order/:orderId` - Edit existing order

**Admin** (wrapped in AdminLayout):
- `/admin/orders` - Order management
- `/admin/menu` - Menu configuration
- `/admin/tables` - Table management
- `/admin/reports` - Reports and analytics
- `/admin/users` - User management

## Code Conventions

### File Naming
- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` or `useXxx.ts`
- Services: `camelCase.ts` or `xxxService.ts`
- Types: `PascalCase` or `camelCase` based on semantics

### Import Alias
- `@` maps to `./src` (configured in Vite and tsconfig)
- Always use absolute imports: `@/components/...`, `@/features/...`

### TypeScript
- Strict mode enabled
- Avoid `any`; prefer explicit types
- Component props: `{ComponentName}Props` interface
- Export default for components, named exports for types

### React Patterns
- Function components with TypeScript
- Early returns for error/loading states
- Hooks per feature in `features/*/hooks`, global in `src/hooks`

### Forms
- React Hook Form + Zod for validation
- Schemas in feature's types or `lib/validations`
- Integrate with Form components from `src/components/ui/form.tsx`

## Environment Variables

Required in `.env`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For admin operations
VITE_PRINT_API_URL=your_print_service_url  # Optional, for printing
```

## State Management Patterns

### Server State (TanStack Query)
- Default config: `staleTime: 5min`, `retry: 1`
- Query keys should be descriptive arrays: `['orders', orderId]`, `['menu', 'categories']`
- Use mutations for create/update/delete operations
- Invalidate relevant queries after mutations

### Client State (Zustand)
- Auth state in `src/lib/auth/authStore.ts`
- Persist auth state across page reloads
- Keep stores minimal; prefer React Query for server state

## Payment Processing

### Payment Flow
1. Order created with status `pending`
2. Items added to order (with optional cooking points and sides)
3. Payment processed via `useProcessPayment` hook
4. Order status updated to `paid`
5. Optional invoice printing

### Payment Methods
Configured in `payment_methods` table:
- CASH, NEQUI, DAVIPLATA, BANCOLOMBIA, DEBIT_CARD, CREDIT_CARD

### Commission Calculation
Located in `src/features/admin/services/reportService.ts`:
- Order totals include tax and fees
- Tip amounts tracked separately
- Commission formulas documented in recent commits

## Testing & Quality

### Linting
- ESLint configured with React 19 rules
- React Hooks plugin for hook usage validation
- React Refresh plugin for HMR

### Type Safety
- All components and hooks fully typed
- Supabase database types auto-generated
- Zod schemas for runtime validation

## Common Workflows

### Adding a New Feature
1. Create feature directory: `src/features/{feature}/`
2. Add components, hooks, services, types subdirectories
3. Export via `index.ts` barrel file
4. Add routes in `src/main.tsx` if needed
5. Update this file if the feature adds significant architectural patterns

### Creating a Protected Route
```tsx
import ProtectedRoute from '@/router/guards/ProtectedRoute'

// In main.tsx routes
{
  path: '/admin/example',
  element: (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminLayout>
        <ExamplePage />
      </AdminLayout>
    </ProtectedRoute>
  )
}
```

### Adding a New Query
1. Define query in feature's `services/` directory
2. Create custom hook using TanStack Query
3. Use appropriate query keys for cache management
4. Handle loading and error states in components

### Working with Forms
1. Define Zod schema in feature's types or `lib/validations`
2. Use `useForm` from `react-hook-form` with `zodResolver`
3. Render using Form components from `src/components/ui/form.tsx`
4. Handle submission with async validation
