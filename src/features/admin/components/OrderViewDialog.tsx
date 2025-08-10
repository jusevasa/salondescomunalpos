import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency } from '@/lib/utils'
import { CalendarClock, CheckCircle2, Eye, ReceiptText, X } from 'lucide-react'
import type { Order } from '../types'

interface OrderViewDialogProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const toTime = (iso: string) => new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

const deriveAvatarFallback = (value: unknown): string => {
  if (value === null || value === undefined) return 'N/A'
  const raw = String(value).trim()
  if (raw.length === 0) return 'N/A'
  const isNumeric = /^[0-9]+$/.test(raw)
  if (isNumeric) return raw
  const letterMatch = raw.match(/\p{L}/u)
  return letterMatch ? letterMatch[0].toUpperCase() : 'N/A'
}

export default function OrderViewDialog({ order, open, onOpenChange }: OrderViewDialogProps) {
  if (!order) return null

  const tableNumber = order.tables?.number ?? order.table_number
  const waiterName = order.profiles?.name ?? order.waiter ?? 'Cliente'
  const isPaid = order.status === 'paid' || order.payment_status === 'paid'
  const isCancelled = order.status === 'cancelled'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Detalle de Orden - Mesa {tableNumber}
          </DialogTitle>
          <DialogDescription>Vista de solo lectura</DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-4 space-y-4 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{deriveAvatarFallback(tableNumber)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">Mesa {tableNumber}</div>
                <div className="text-xs text-muted-foreground">Atendido por {waiterName}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isCancelled ? 'destructive' : isPaid ? 'default' : 'secondary'}>
                {order.status}
              </Badge>
              <div className="flex items-center text-xs text-muted-foreground gap-1">
                <CalendarClock className="h-3.5 w-3.5" />
                {toTime(order.created_at)}
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <ReceiptText className="h-4 w-4" />
                <span className="font-medium">Items</span>
                <Badge variant="outline">{order.items?.length ?? 0}</Badge>
              </div>
              {order.items && order.items.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[55%]">Producto</TableHead>
                        <TableHead className="w-[15%] text-right">Cant.</TableHead>
                        <TableHead className="w-[15%] text-right">Precio</TableHead>
                        <TableHead className="w-[15%] text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{item.name}</span>
                              {item.category && (
                                <span className="text-xs text-muted-foreground">{item.category}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Sin items</div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Impuestos</span>
              <span>{formatCurrency(order.tax_amount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total Orden</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
            {isPaid && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Propina:</span>
                  <span className="ml-auto">{formatCurrency(order.tip_amount)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Total Pagado:</span>
                  <span className="ml-auto">{formatCurrency(order.paid_amount)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Total Final:</span>
                  <span className="ml-auto">{formatCurrency(order.grand_total)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Vueltas:</span>
                  <span className="ml-auto">{formatCurrency(order.change_amount)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t">
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              <X className="h-4 w-4 mr-2" />
              Cerrar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}


