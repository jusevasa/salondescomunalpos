import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Printer, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { usePrintServices } from '@/features/shared/hooks/usePrintServices'
import { useToast } from '@/components/ui/toast'
import { transformOrderToPrintRequest } from '@/features/shared/utils/printTransformers'
import type { Order } from '../types'
import type { DatabaseOrder, DatabaseOrderItem } from '@/features/shared/types/database'

interface PrintOrderButtonProps {
  order: Order
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  disabled?: boolean
  showText?: boolean
}

// Adaptador para convertir Order a DatabaseOrder
const adaptOrderToDatabaseOrder = (order: Order): DatabaseOrder => {
  return {
    id: order.id,
    table_id: order.table_id,
    profile_id: order.profile_id,
    diners_count: order.diners_count,
    status: order.status,
    subtotal: order.subtotal,
    tax_amount: order.tax_amount,
    total_amount: order.total_amount,
    tip_amount: order.tip_amount,
    grand_total: order.grand_total,
    paid_amount: order.paid_amount,
    change_amount: order.change_amount,
    notes: order.notes,
    created_at: order.created_at,
    updated_at: order.updated_at,
    tables: order.table ? {
      id: order.table.id,
      number: order.table.number,
      capacity: order.table.capacity,
      active: order.table.active,
      created_at: order.table.created_at,
      updated_at: order.table.updated_at
    } : undefined,
    order_items: order.order_items?.map((item): DatabaseOrderItem => ({
      id: item.id || 0,
      order_id: item.order_id || order.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      cooking_point_id: item.cooking_point_id,
      notes: item.notes,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      menu_items: item.menu_item ? {
        id: item.menu_item.id,
        name: item.menu_item.name,
        price: item.menu_item.price,
        base_price: item.menu_item.base_price,
        category_id: item.menu_item.category_id,
        active: item.menu_item.active,
        tax: item.menu_item.tax,
        fee: item.menu_item.fee,
        author: item.menu_item.author,
        has_cooking_point: item.menu_item.has_cooking_point,
        has_sides: item.menu_item.has_sides,
        max_sides_count: item.menu_item.max_sides_count,
        created_at: item.menu_item.created_at,
        updated_at: item.menu_item.updated_at,
        menu_categories: item.menu_item.menu_categories
      } : undefined,
      order_item_sides: item.sides?.map(side => ({
        id: 0, // Temporal ID
        order_item_id: item.id || 0,
        side_id: side.id,
        quantity: 1,
        sides: side
      }))
    }))
  }
}

export default function PrintOrderButton({ 
  order, 
  variant = 'outline',
  size = 'default',
  className = '',
  disabled = false,
  showText = true
}: PrintOrderButtonProps) {
  const [lastPrintStatus, setLastPrintStatus] = useState<'success' | 'error' | null>(null)
  
  const { printOrder, isPrintingOrder } = usePrintServices()
  const { addToast } = useToast()

  const handlePrint = async () => {
    if (!order || isPrintingOrder) return

    setLastPrintStatus(null)

    try {
      // Transform order to print request format
      const databaseOrder = adaptOrderToDatabaseOrder(order)
      const printRequest = transformOrderToPrintRequest(databaseOrder)
      await printOrder(printRequest)
      
      setLastPrintStatus('success')
      addToast({
        title: 'Comanda enviada a impresión',
        description: `Orden #${order.id} - Mesa ${order.table?.number}`,
        variant: 'success'
      })
    } catch (error) {
      setLastPrintStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Error al imprimir la comanda'
      addToast({
        title: 'Error al imprimir',
        description: errorMessage,
        variant: 'error'
      })
      console.error('Error printing order:', error)
    } finally {
      // Reset status after 3 seconds
      setTimeout(() => setLastPrintStatus(null), 3000)
    }
  }

  const getIcon = () => {
    if (isPrintingOrder) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    
    if (lastPrintStatus === 'success') {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    }
    
    if (lastPrintStatus === 'error') {
      return <AlertCircle className="h-4 w-4 text-red-600" />
    }
    
    return <Printer className="h-4 w-4" />
  }

  const getButtonText = () => {
    if (isPrintingOrder) return 'Imprimiendo...'
    if (lastPrintStatus === 'success') return 'Impreso'
    if (lastPrintStatus === 'error') return 'Error'
    return 'Imprimir Comanda'
  }

  const isDisabled = disabled || isPrintingOrder || !order

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePrint}
      disabled={isDisabled}
      className={`${className} ${lastPrintStatus === 'success' ? 'border-green-600' : ''} ${lastPrintStatus === 'error' ? 'border-red-600' : ''}`}
    >
      {getIcon()}
      {showText && <span className="ml-2">{getButtonText()}</span>}
    </Button>
  )
}