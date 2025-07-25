import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/config/supabase';
import { useAuth } from '@/hooks/useAuth';
import type {
  Order,
  CreateOrderData,
  AddOrderItemData,
  OrderItem,
} from '../types';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';

export const useOrderManagement = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Obtener orden activa de una mesa
  const useActiveOrderByTable = (tableId: number) => {
    return useQuery({
      queryKey: ['activeOrder', tableId],
      queryFn: async (): Promise<Order | null> => {
        const { data, error } = await supabase
          .from('orders')
          .select(
            `
            *,
            table:tables(*),
            order_items(
              *,
              menu_item:menu_items(*)
            )
          `
          )
          .eq('table_id', tableId)
          .in('status', ['pending', 'preparing', 'ready'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
      },
      enabled: !!tableId,
    });
  };

  // Crear nueva orden
  const createOrder = useMutation({
    mutationFn: async (orderData: CreateOrderData): Promise<Order> => {
      if (!user?.id) throw new Error('Usuario no autenticado');

      const dateTimeNow = format(new Date(), 'yyyy-MM-dd HH:mm:ss', {
        locale: es,
      });

      const { data, error } = await supabase
        .from('orders')
        .insert({
          table_id: orderData.table_id,
          profile_id: user.id,
          diners_count: orderData.diners_count,
          notes: orderData.notes,
          status: 'ready',
          subtotal: 0,
          tax_amount: 0,
          total_amount: 0,
          tip_amount: 0,
          grand_total: 0,
          paid_amount: 0,
          change_amount: 0,
          created_at: dateTimeNow,
          updated_at: dateTimeNow,
        })
        .select(
          `
          *,
          table:tables(*),
          order_items(
            *,
            menu_item:menu_items(*)
          )
        `
        )
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['activeOrder', data.table_id],
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  // Agregar item a orden
  const addOrderItem = useMutation({
    mutationFn: async ({
      orderId,
      itemData,
    }: {
      orderId: number;
      itemData: AddOrderItemData;
    }): Promise<OrderItem> => {
      // Primero obtener el precio del item
      const { data: menuItem, error: menuError } = await supabase
        .from('menu_items')
        .select('price')
        .eq('id', itemData.menu_item_id)
        .single();

      if (menuError) throw menuError;

      const subtotal = menuItem.price * itemData.quantity;

      const dateTimeNow = format(new Date(), 'yyyy-MM-dd HH:mm:ss', {
        locale: es,
      });

      const { data, error } = await supabase
        .from('order_items')
        .insert({
          order_id: orderId,
          menu_item_id: itemData.menu_item_id,
          quantity: itemData.quantity,
          unit_price: menuItem.price,
          subtotal: subtotal,
          cooking_point_id: itemData.cooking_point_id,
          notes: itemData.notes,
          created_at: dateTimeNow,
          updated_at: dateTimeNow,
        })
        .select(
          `
          *,
          menu_item:menu_items(*)
        `
        )
        .single();

      if (error) throw error;

      // Si hay sides, agregarlos
      if (itemData.sides && itemData.sides.length > 0) {
        const sidePromises = itemData.sides.map((sideId) =>
          supabase.from('order_item_sides').insert({
            order_item_id: data.id,
            side_id: sideId,
            quantity: 1,
          })
        );

        await Promise.all(sidePromises);
      }

      // Actualizar totales de la orden
      await updateOrderTotals(orderId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeOrder'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  // Actualizar totales de la orden
  const updateOrderTotals = async (orderId: number) => {
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select('subtotal')
      .eq('order_id', orderId);

    if (error) throw error;

    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = subtotal * 0.19; // 19% IVA
    const totalAmount = subtotal + taxAmount;

    await supabase
      .from('orders')
      .update({
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        grand_total: totalAmount,
      })
      .eq('id', orderId);
  };

  // Actualizar cantidad de comensales
  const updateDinersCount = useMutation({
    mutationFn: async ({
      orderId,
      dinersCount,
    }: {
      orderId: number;
      dinersCount: number;
    }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ diners_count: dinersCount })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeOrder'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  // Actualizar orden
  const updateOrder = useMutation({
    mutationFn: async ({
      orderId,
      data,
    }: {
      orderId: number;
      data: Partial<CreateOrderData>;
    }) => {
      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update(data)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return updatedOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeOrder'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
    },
  });

  return {
    useActiveOrderByTable,
    createOrder,
    addOrderItem,
    updateDinersCount,
    updateOrder,
  };
};
