import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Users, ShoppingCart, ChefHat, Utensils, FileText, Printer } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { MenuItem, Side, CookingPoint } from '../types'

interface CartItem {
  menu_item: MenuItem
  quantity: number
  cooking_point_id?: number
  notes?: string
  selectedSides?: Side[]
}

interface OrderConfirmationModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (shouldPrint: boolean) => void
  cart: CartItem[]
  dinersCount: number
  orderNotes: string
  cookingPoints?: CookingPoint[]
  isLoading?: boolean
  title: string
  confirmButtonText: string
  printOrder?: boolean
  onPrintOrderChange?: (shouldPrint: boolean) => void
}

export default function OrderConfirmationModal({
  open,
  onClose,
  onConfirm,
  cart,
  dinersCount,
  orderNotes,
  cookingPoints,
  isLoading = false,
  title,
  confirmButtonText,
  printOrder = true,
  onPrintOrderChange
}: OrderConfirmationModalProps) {
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.menu_item.price * item.quantity), 0)
  }

  const getCookingPointName = (cookingPointId?: number) => {
    if (!cookingPointId || !cookingPoints) return null
    const point = cookingPoints.find(p => p.id === cookingPointId)
    return point?.name
  }

  const handleConfirm = () => {
    onConfirm(printOrder)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Revisa los detalles de la orden antes de confirmar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Details */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Comensales:</span>
                  <Badge variant="secondary">{dinersCount}</Badge>
                </div>
                {orderNotes && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Notas:</span>
                    <span className="text-muted-foreground">{orderNotes}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cart Items */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Items de la orden ({cart.length})
            </h3>
            
            {cart.map((item, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {/* Item Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.menu_item.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatCurrency(item.menu_item.price)} c/u</span>
                          <span>•</span>
                          <span>Cantidad: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-green-600">
                          {formatCurrency(item.menu_item.price * item.quantity)}
                        </span>
                      </div>
                    </div>

                    {/* Cooking Point */}
                    {item.cooking_point_id && (
                      <div className="flex items-center gap-2 text-xs">
                        <ChefHat className="h-3 w-3 text-orange-500" />
                        <span className="text-muted-foreground">Punto de cocción:</span>
                        <Badge variant="outline" className="text-xs">
                          {getCookingPointName(item.cooking_point_id)}
                        </Badge>
                      </div>
                    )}

                    {/* Sides */}
                    {item.selectedSides && item.selectedSides.length > 0 && (
                      <div className="flex items-start gap-2 text-xs">
                        <Utensils className="h-3 w-3 text-blue-500 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-muted-foreground">Acompañamientos:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.selectedSides.map((side) => (
                              <Badge key={side.id} variant="outline" className="text-xs">
                                {side.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {item.notes && (
                      <div className="flex items-start gap-2 text-xs">
                        <FileText className="h-3 w-3 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <span className="text-muted-foreground">Notas:</span>
                          <p className="text-gray-700 mt-1">{item.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          {/* Print Option */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="print-order"
                  checked={printOrder}
                  onCheckedChange={(checked) => onPrintOrderChange?.(checked as boolean)}
                />
                <Label
                  htmlFor="print-order"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir comanda automáticamente
                </Label>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total de la orden:</span>
            <span className="text-green-600">
              {formatCurrency(calculateTotal())}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'Procesando...' : confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}