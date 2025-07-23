import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import type { Order } from '../types'

interface OrdersTableProps {
  orders: Order[]
  isLoading?: boolean
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
        <span className="font-medium">{info.getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor('customer_name', {
    header: 'Cliente',
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
]

export default function OrdersTable({ orders, isLoading }: OrdersTableProps) {
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
        {orders.map((order) => (
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
                      {order.customer_name || 'Sin nombre'}
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
                <Badge variant={getStatusVariant(order.status)}>
                  {order.status}
                </Badge>
                <Badge variant={getPaymentStatusVariant(order.payment_status)}>
                  {order.payment_status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
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
                    className="cursor-pointer hover:bg-muted/50"
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
    </>
  )
} 