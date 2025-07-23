import { useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { CreditCard, Edit3 } from 'lucide-react'
import { useRole } from '@/hooks/useRole'
import PaymentDialog from './PaymentDialog'
import OrderEditDialog from './OrderEditDialog'
import type { Order } from '../types'

interface OrdersTableProps {
  orders: Order[]
  isLoading?: boolean
}

export default function OrdersTable({ orders, isLoading }: OrdersTableProps) {
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null)
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const { isAdmin } = useRole()

  const handlePayOrder = (order: Order) => {
    setSelectedOrderForPayment(order)
    setPaymentDialogOpen(true)
  }

  const handleEditOrder = (order: Order) => {
    setSelectedOrderForEdit(order)
    setEditDialogOpen(true)
  }

  const columnHelper = createColumnHelper<Order>()

  const getStatusVariant = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'outline'
      case 'preparing': return 'secondary'
      case 'ready': return 'default'
      case 'delivered': return 'outline'
      case 'cancelled': return 'destructive'
      default: return 'outline'
    }
  }

  const getPaymentStatusVariant = (status: Order['payment_status']) => {
    switch (status) {
      case 'pending': return 'destructive'
      case 'paid': return 'default'
      case 'cancelled': return 'outline'
      default: return 'outline'
    }
  }

  const columns = [
    columnHelper.accessor('table_number', {
      header: 'Mesa',
      cell: (info) => (
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs font-medium">
              {info.getValue()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium lg:hidden">{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor('waiter', {
      header: 'Mesero',
      cell: (info) => info.getValue() || 'Sin nombre',
    }),
    columnHelper.accessor('total_amount', {
      header: 'Total',
      cell: (info) => `$${info.getValue().toLocaleString()}`,
    }),
    columnHelper.accessor('status', {
      header: 'Estado',
      cell: (info) => (
        <Badge variant={getStatusVariant(info.getValue())}>
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('payment_status', {
      header: 'Pago',
      cell: (info) => (
        <Badge variant={getPaymentStatusVariant(info.getValue())}>
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('created_at', {
      header: 'Hora',
      cell: (info) => {
        const date = new Date(info.getValue())
        return date.toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit'
        })
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const order = row.original
        const isPaid = order.payment_status === 'paid'
        
        return (
          <div className="flex items-center gap-2">
            {!isPaid && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePayOrder(order)}
                className="h-8 w-8 p-0"
              >
                <CreditCard className="h-4 w-4" />
              </Button>
            )}
            
            {isAdmin() && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditOrder(order)}
                className="h-8 w-8 p-0"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    }),
  ]

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Mobile Cards View */}
      <div className="lg:hidden space-y-4">
        {orders.map((order) => {
          const isPaid = order.payment_status === 'paid'
          
          return (
            <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="font-medium">
                        {order.table_number}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Mesa {order.table_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.waiter || 'Sin nombre'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${order.total_amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleTimeString('es-CO', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                    <Badge variant={getPaymentStatusVariant(order.payment_status)}>
                      {order.payment_status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!isPaid && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePayOrder(order)}
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Pagar
                      </Button>
                    )}
                    
                    {isAdmin() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditOrder(order)}
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Card>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No hay órdenes para mostrar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        order={selectedOrderForPayment}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
      />

      {/* Order Edit Dialog */}
      <OrderEditDialog
        order={selectedOrderForEdit}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </>
  )
} 