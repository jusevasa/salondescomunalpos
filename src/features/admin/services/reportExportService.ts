import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { supabase } from '@/lib/config/supabase'
import type { ReportsFilters } from '../types'

type OrderForExport = {
  id: number
  created_at: string
  subtotal: number
  tax_amount: number
  total_amount: number
  tip_amount: number
  grand_total: number
  order_items: Array<{
    id: number
    menu_items: { name: string } | null
  }>
}

type PaymentWithMethod = {
  order_id: number
  status: string
  created_at: string
  payment_method: { id: number; name: string } | null
}

export async function exportSalesReportToExcel(filters: ReportsFilters): Promise<void> {
  const { date_from, date_to } = filters

  const startDate = `${date_from} 00:00:00`
  const endDate = `${date_to} 23:59:59`

  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id,
      created_at,
      subtotal,
      tax_amount,
      total_amount,
      tip_amount,
      grand_total,
      order_items (
        id,
        menu_items ( name )
      )
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .eq('status', 'paid')

  if (ordersError) {
    throw new Error(`No se pudieron cargar órdenes para exportación: ${ordersError.message}`)
  }

  const normalizeMenuItem = (value: unknown): { name: string } | null => {
    if (!value) return null
    if (Array.isArray(value)) {
      const first = value[0] as any
      return first && typeof first === 'object' && 'name' in first ? { name: String(first.name ?? '') } : null
    }
    const obj = value as any
    return typeof obj === 'object' && 'name' in obj ? { name: String(obj.name ?? '') } : null
  }

  const ordersRaw = (ordersData as any[]) || []
  const orders: OrderForExport[] = ordersRaw.map((o: any) => ({
    id: Number(o.id),
    created_at: String(o.created_at),
    subtotal: Number(o.subtotal) || 0,
    tax_amount: Number(o.tax_amount) || 0,
    total_amount: Number(o.total_amount) || 0,
    tip_amount: Number(o.tip_amount) || 0,
    grand_total: Number(o.grand_total) || 0,
    order_items: (o.order_items || []).map((oi: any) => ({
      id: Number(oi.id),
      menu_items: normalizeMenuItem(oi.menu_items),
    })),
  }))
  const orderIds = orders.map(o => o.id)

  let paymentsByOrder = new Map<number, PaymentWithMethod | undefined>()

  if (orderIds.length > 0) {
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        order_id,
        status,
        created_at,
        payment_method:payment_methods ( id, name )
      `)
      .in('order_id', orderIds)

    if (paymentsError) {
      throw new Error(`No se pudieron cargar pagos para exportación: ${paymentsError.message}`)
    }

    const normalizePaymentMethod = (value: unknown): { id: number; name: string } | null => {
      if (!value) return null
      if (Array.isArray(value)) {
        const first = value[0] as any
        return first && typeof first === 'object'
          ? { id: Number(first.id), name: String(first.name ?? '') }
          : null
      }
      const obj = value as any
      return typeof obj === 'object' ? { id: Number(obj.id), name: String(obj.name ?? '') } : null
    }

    const paymentsRaw = (paymentsData as any[]) || []
    const payments: PaymentWithMethod[] = paymentsRaw.map((p: any) => ({
      order_id: Number(p.order_id),
      status: String(p.status),
      created_at: String(p.created_at),
      payment_method: normalizePaymentMethod(p.payment_method),
    }))

    const grouped = new Map<number, PaymentWithMethod[]>()
    for (const p of payments) {
      const list = grouped.get(p.order_id) || []
      list.push(p)
      grouped.set(p.order_id, list)
    }
    for (const [orderId, list] of grouped.entries()) {
      const completed = list
        .filter(p => p.status === 'completed')
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
      const anySorted = list.sort((a, b) => a.created_at.localeCompare(b.created_at))
      paymentsByOrder.set(orderId, completed[completed.length - 1] || anySorted[anySorted.length - 1])
    }
  }

  const rows = [] as Array<Record<string, string | number>>
  for (const order of orders) {
    const payment = paymentsByOrder.get(order.id)
    const paymentMethodName = payment?.payment_method?.name || ''
    const orderDate = new Date(order.created_at)
    const fecha = orderDate.toISOString().slice(0, 10)

    if (order.order_items?.length) {
      for (const item of order.order_items) {
        rows.push({
          'Número Factura': order.id,
          'Subtotal': Number(order.subtotal) || 0,
          'Impuestos': Number(order.tax_amount) || 0,
          'Total': Number(order.total_amount) || 0,
          'Propina': Number(order.tip_amount) || 0,
          'Gran Total': Number(order.grand_total) || 0,
          'Método de Pago': paymentMethodName,
          'Producto': item.menu_items?.name || '',
          'Fecha': fecha,
        })
      }
    } else {
      rows.push({
        'Número Factura': order.id,
        'Subtotal': Number(order.subtotal) || 0,
        'Impuestos': Number(order.tax_amount) || 0,
        'Total': Number(order.total_amount) || 0,
        'Propina': Number(order.tip_amount) || 0,
        'Gran Total': Number(order.grand_total) || 0,
        'Método de Pago': paymentMethodName,
        'Producto': '',
        'Fecha': fecha,
      })
    }
  }

  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.json_to_sheet(rows)

  sheet['!cols'] = [
    { width: 16 },
    { width: 14 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 14 },
    { width: 20 },
    { width: 30 },
    { width: 12 },
  ]

  XLSX.utils.book_append_sheet(workbook, sheet, 'Ventas')

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const fileName = `reporte_ventas_${date_from}_a_${date_to}.xlsx`
  saveAs(blob, fileName)
}


