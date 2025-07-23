# Documentación de Base de Datos - Salóndescomunal

## Resumen
Sistema de gestión de restaurante con roles de usuario (admin/waiter), gestión de menú, órdenes y pagos.

## Roles de Usuario
- `admin`: Acceso completo a todas las funcionalidades
- `waiter`: Acceso a crear/gestionar órdenes y pagos

## Métodos de Pago Disponibles
- Efectivo (`CASH`)
- Nequi (`NEQUI`) 
- Daviplata (`DAVIPLATA`)
- Bancolombia (`BANCOLOMBIA`)
- Tarjeta Débito (`DEBIT_CARD`)
- Tarjeta Crédito (`CREDIT_CARD`)

## TypeScript Interfaces

```typescript
// Enums
export enum UserRole {
  ADMIN = 'admin',
  WAITER = 'waiter'
}

export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing', 
  READY = 'ready',
  DELIVERED = 'delivered',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed', 
  CANCELLED = 'cancelled'
}

// Core Interfaces
export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  base_price?: number;
  category_id: number;
  active: boolean;
  tax: number;
  fee: number;
  author: string;
  has_cooking_point: boolean;
  has_sides: boolean;
  created_at: string;
  updated_at: string;
  category?: MenuCategory;
}

export interface Side {
  id: number;
  name: string;
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ItemSide {
  id: number;
  menu_item_id: number;
  side_id: number;
  max_quantity: number;
  created_at: string;
  updated_at: string;
  side?: Side;
}

export interface CookingPoint {
  id: number;
  name: string;
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: number;
  number: string;
  capacity: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  table_id: number;
  profile_id: string;
  diners_count: number;
  status: OrderStatus;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  tip_amount: number;
  grand_total: number;
  paid_amount: number;
  change_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  table?: Table;
  profile?: Profile;
  order_items?: OrderItem[];
  payments?: Payment[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  cooking_point_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  menu_item?: MenuItem;
  cooking_point?: CookingPoint;
  order_item_sides?: OrderItemSide[];
}

export interface OrderItemSide {
  id: number;
  order_item_id: number;
  side_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  side?: Side;
}

export interface Payment {
  id: number;
  order_id: number;
  payment_method_id: number;
  amount: number;
  tip_amount: number;
  tip_percentage?: number;
  total_paid: number;
  received_amount?: number;
  change_amount: number;
  reference_number?: string;
  status: PaymentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  payment_method?: PaymentMethod;
}
```

## Queries Supabase (Frontend)

### Autenticación y Perfiles

```typescript
// Obtener perfil del usuario actual
const getCurrentProfile = async () => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.user.id)
    .single();
    
  return { data, error };
};

// Verificar si es admin
const isAdmin = async () => {
  const { data } = await getCurrentProfile();
  return data?.role === 'admin';
};
```

### Menú

```typescript
// Obtener categorías activas
const getActiveCategories = async () => {
  const { data, error } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('active', true)
    .order('display_order');
    
  return { data, error };
};

// Obtener items del menú con categoría
const getMenuItems = async (categoryId?: number) => {
  let query = supabase
    .from('menu_items')
    .select(`
      *,
      category:menu_categories(*)
    `)
    .eq('active', true);
    
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  
  const { data, error } = await query;
  return { data, error };
};

// Obtener acompañamientos de un item
const getItemSides = async (menuItemId: number) => {
  const { data, error } = await supabase
    .from('item_sides')
    .select(`
      *,
      side:sides(*)
    `)
    .eq('menu_item_id', menuItemId)
    .eq('side.active', true);
    
  return { data, error };
};

// Obtener puntos de cocción activos
const getCookingPoints = async () => {
  const { data, error } = await supabase
    .from('cooking_points')
    .select('*')
    .eq('active', true)
    .order('display_order');
    
  return { data, error };
};
```

### Mesas

```typescript
// Obtener mesas activas
const getActiveTables = async () => {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('active', true)
    .order('number');
    
  return { data, error };
};
```

### Órdenes

```typescript
// Crear nueva orden
const createOrder = async (orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();
    
  return { data, error };
};

// Obtener órdenes con detalles
const getOrders = async (status?: OrderStatus) => {
  let query = supabase
    .from('orders')
    .select(`
      *,
      table:tables(*),
      profile:profiles(*),
      order_items(
        *,
        menu_item:menu_items(*),
        cooking_point:cooking_points(*),
        order_item_sides(
          *,
          side:sides(*)
        )
      ),
      payments(
        *,
        payment_method:payment_methods(*)
      )
    `)
    .order('created_at', { ascending: false });
    
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  return { data, error };
};

// Agregar item a orden
const addOrderItem = async (orderItemData: Omit<OrderItem, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('order_items')
    .insert(orderItemData)
    .select()
    .single();
    
  return { data, error };
};

// Agregar acompañamientos a item
const addOrderItemSides = async (orderItemSides: Omit<OrderItemSide, 'id' | 'created_at' | 'updated_at'>[]) => {
  const { data, error } = await supabase
    .from('order_item_sides')
    .insert(orderItemSides)
    .select();
    
  return { data, error };
};

// Actualizar estado de orden
const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
    .single();
    
  return { data, error };
};
```

### Pagos

```typescript
// Obtener métodos de pago activos
const getPaymentMethods = async () => {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('active', true)
    .order('display_order');
    
  return { data, error };
};

// Procesar pago
const processPayment = async (paymentData: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('payments')
    .insert(paymentData)
    .select()
    .single();
    
  return { data, error };
};

// Obtener pagos de una orden
const getOrderPayments = async (orderId: number) => {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      payment_method:payment_methods(*)
    `)
    .eq('order_id', orderId)
    .order('created_at');
    
  return { data, error };
};
```

## Administración (Solo Admin)

```typescript
// Crear categoría de menú
const createMenuCategory = async (categoryData: Omit<MenuCategory, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('menu_categories')
    .insert(categoryData)
    .select()
    .single();
    
  return { data, error };
};

// Crear item de menú
const createMenuItem = async (itemData: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('menu_items')
    .insert(itemData)
    .select()
    .single();
    
  return { data, error };
};

// Crear mesa
const createTable = async (tableData: Omit<Table, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('tables')
    .insert(tableData)
    .select()
    .single();
    
  return { data, error };
};

// Crear perfil de usuario (se crea automáticamente con auth.uid())
const createProfile = async (profileData: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert(profileData)
    .select()
    .single();
    
  return { data, error };
};
```

## Suscripciones en Tiempo Real

```typescript
// Suscribirse a cambios en órdenes
const subscribeToOrders = (callback: (payload: any) => void) => {
  return supabase
    .channel('orders-channel')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'orders' 
      }, 
      callback
    )
    .subscribe();
};

// Suscribirse a cambios en pagos
const subscribeToPayments = (callback: (payload: any) => void) => {
  return supabase
    .channel('payments-channel')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'payments' 
      }, 
      callback
    )
    .subscribe();
};
```

## Notas Importantes

1. **RLS (Row Level Security)**: Todas las tablas tienen políticas de seguridad implementadas
2. **Autenticación**: Usar `auth.uid()` para identificar al usuario actual
3. **Roles**: Los admins pueden gestionar todos los datos, los waiters solo órdenes/pagos
4. **Timestamps**: Todos los registros incluyen `created_at` y `updated_at`
5. **Soft Delete**: Usar campo `active` en lugar de eliminar registros 