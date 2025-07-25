import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, Users, ShoppingCart, X, Search, ChefHat, Utensils } from 'lucide-react'
import { useOrderManagement } from '../hooks/useOrderManagement'
import { useMenuData } from '../hooks/useMenuData'
import { usePrintServices } from '@/features/shared/hooks/usePrintServices'
import { useToast } from '@/components/ui/toast'
import { transformOrderToPrintRequest } from '@/features/shared/utils/printTransformers'
import { formatCurrency } from '@/lib/utils'
import OrderConfirmationModal from './OrderConfirmationModal'
import type { MenuItem, AddOrderItemData, Side, Table } from '../types'
import type { DatabaseOrder } from '@/features/shared/types/database'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface CreateOrderFormProps {
  table: Table
  onSuccess: () => void
  onCancel: () => void
}

interface CartItem extends AddOrderItemData {
  menu_item: MenuItem
  tempId: string
  selectedSides?: Side[]
}

export default function CreateOrderForm({ table, onSuccess, onCancel }: CreateOrderFormProps) {
  const [dinersCount, setDinersCount] = useState(2)
  const [notes, setNotes] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)


  const { createOrder, addOrderItem } = useOrderManagement()
  const { useMenuCategories, useMenuItemsSearch, useCookingPoints, useSides } = useMenuData()
  const { printOrder } = usePrintServices()
  const { addToast } = useToast()

  const { data: categories } = useMenuCategories()
  const { data: cookingPoints } = useCookingPoints()
  const { data: sides } = useSides()

  // Use optimized search hook that queries Supabase directly
  const { data: menuItems } = useMenuItemsSearch(
    searchTerm.trim() || undefined,
    selectedCategory || undefined
  )

  // Set default category when categories load
  useEffect(() => {
    if (categories && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id)
    }
  }, [categories, selectedCategory])

  // Use the menu items directly from the optimized search
  const filteredMenuItems = menuItems || []

  const addToCart = (menuItem: MenuItem) => {
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(item => item.menu_item_id === menuItem.id)

    if (existingItemIndex >= 0) {
      // Increment quantity of existing item
      setCart(prev => prev.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      // Add new item to cart
      const tempId = `temp-${Date.now()}-${Math.random()}`
      const newItem: CartItem = {
        menu_item_id: menuItem.id,
        quantity: 1,
        menu_item: menuItem,
        tempId,
        selectedSides: [],
      }
      setCart(prev => [...prev, newItem])
    }
  }

  const updateCartItemSides = (tempId: string, sideIds: number[]) => {
    const selectedSides = sides?.filter(side => sideIds.includes(side.id)) || []
    setCart(prev => prev.map(item =>
      item.tempId === tempId
        ? { ...item, sides: sideIds, selectedSides }
        : item
    ))
  }

  const toggleSideForItem = (tempId: string, sideId: number) => {
    const cartItem = cart.find(item => item.tempId === tempId)
    if (!cartItem) return

    const currentSides = cartItem.sides || []
    const maxSides = cartItem.menu_item.max_sides_count || 0

    if (currentSides.includes(sideId)) {
      // Remove side
      const newSides = currentSides.filter(id => id !== sideId)
      updateCartItemSides(tempId, newSides)
    } else if (currentSides.length < maxSides) {
      // Add side if under limit
      const newSides = [...currentSides, sideId]
      updateCartItemSides(tempId, newSides)
    }
  }

  const getItemQuantityInCart = (menuItemId: number) => {
    const item = cart.find(cartItem => cartItem.menu_item_id === menuItemId)
    return item ? item.quantity : 0
  }

  const updateCartItemQuantity = (tempId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.tempId !== tempId))
    } else {
      setCart(prev => prev.map(item =>
        item.tempId === tempId ? { ...item, quantity } : item
      ))
    }
  }

  const removeFromCart = (tempId: string) => {
    setCart(prev => prev.filter(item => item.tempId !== tempId))
  }

  const updateCartItemCookingPoint = (tempId: string, cookingPointId: number) => {
    setCart(prev => prev.map(item =>
      item.tempId === tempId ? { ...item, cooking_point_id: cookingPointId } : item
    ))
  }

  const updateCartItemNotes = (tempId: string, itemNotes: string) => {
    setCart(prev => prev.map(item =>
      item.tempId === tempId ? { ...item, notes: itemNotes } : item
    ))
  }

  const calculateCartTotal = () => {
    return cart.reduce((total, item) => total + (item.menu_item.price * item.quantity), 0)
  }

  const handleCreateOrder = async () => {
    if (cart.length === 0) return
    setShowConfirmationModal(true)
  }

  const handleConfirmOrder = async () => {
    try {
      // Create new order
      const newOrder = await createOrder.mutateAsync({
        table_id: table.id,
        diners_count: dinersCount,
        notes,
      })

      // Add all cart items to the order
      for (const item of cart) {
        await addOrderItem.mutateAsync({
          orderId: newOrder.id,
          itemData: {
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            cooking_point_id: item.cooking_point_id,
            notes: item.notes,
            sides: item.sides,
          },
        })
      }

      try {
        const dateTimeNow = format(
          new Date(),
          'yyyy-MM-dd HH:mm:ss',{
            locale:es
          }
        )

        const orderForPrint: DatabaseOrder = {
          id: newOrder.id,
          table_id: table.id,
          profile_id: newOrder.profile_id,
          diners_count: dinersCount,
          status: 'pending',
          subtotal: calculateCartTotal(),
          tax_amount: 0,
          total_amount: calculateCartTotal(),
          tip_amount: 0,
          grand_total: calculateCartTotal(),
          paid_amount: 0,
          change_amount: 0,
          notes,
          created_at: dateTimeNow,
          updated_at: dateTimeNow,
          tables: {
            id: table.id,
            number: table.number,
            capacity: table.capacity,
            active: table.active,
            created_at: table.created_at,
            updated_at: table.updated_at
          },
          order_items: cart.map((item, index) => ({
            id: index + 1,
            order_id: newOrder.id,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            unit_price: item.menu_item.price,
            subtotal: item.menu_item.price * item.quantity,
            cooking_point_id: item.cooking_point_id,
            notes: item.notes,
            created_at: dateTimeNow,
            updated_at: dateTimeNow,
            menu_items: {
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
            },
            order_item_sides: item.selectedSides?.map(side => ({
              id: 0,
              order_item_id: index + 1,
              side_id: side.id,
              quantity: 1,
              sides: side
            }))
          }))
        }

        const printRequest = transformOrderToPrintRequest(orderForPrint)
        await printOrder(printRequest)

        addToast({
          title: 'Orden creada e impresa',
          description: `Orden #${newOrder.id} - Mesa ${table.number}`,
          variant: 'success'
        })
      } catch (printError) {
        console.error('Error printing order:', printError)
        addToast({
          title: 'Orden creada',
          description: 'La orden se creó correctamente, pero hubo un error al imprimir',
          variant: 'warning'
        })
      }

      setShowConfirmationModal(false)
      onSuccess()
    } catch (error) {
      console.error('Error creating order:', error)
      addToast({
        title: 'Error al crear la orden',
        description: 'Hubo un problema al crear la orden. Inténtalo de nuevo.',
        variant: 'error'
      })
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Menu Section */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Configuración de la Orden
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="diners">Número de comensales</Label>
              <Input
                id="diners"
                type="number"
                min="1"
                max="20"
                value={dinersCount}
                onChange={(e) => setDinersCount(parseInt(e.target.value) || 1)}
                className="w-32"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-notes">Notas de la orden</Label>
              <Input
                id="order-notes"
                placeholder="Notas especiales para la orden..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Menú</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar productos</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Horizontal Category Buttons */}
            <div className="space-y-2">
              <Label>Categorías</Label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="whitespace-nowrap flex-shrink-0"
                >
                  Todas
                </Button>
                {categories?.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="whitespace-nowrap flex-shrink-0"
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="max-h-[600px] overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredMenuItems.map((item) => {
                  const quantityInCart = getItemQuantityInCart(item.id)
                  return (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:shadow-md transition-shadow hover:bg-gray-50"
                      onClick={() => addToCart(item)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {item.name}
                          {item.has_cooking_point && (
                            <ChefHat className="h-3 w-3 text-orange-500" />
                          )}
                          {item.has_sides && (
                            <Utensils className="h-3 w-3 text-blue-500" />
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-green-600">
                            {formatCurrency(item.price)}
                          </span>
                          <div className="relative">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                addToCart(item)
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            {quantityInCart > 0 && (
                              <Badge
                                className="absolute -top-2 -right-2 bg-green-600 text-white min-w-[20px] h-5 flex items-center justify-center rounded-full text-xs font-bold"
                              >
                                {quantityInCart}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {item.has_sides && item.max_sides_count > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Máx. {item.max_sides_count} acompañamiento{item.max_sides_count > 1 ? 's' : ''}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart Section */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Orden ({cart.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-auto space-y-3">
              {cart.map((item) => (
                <Card key={item.tempId} className="p-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.menu_item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.menu_item.price)} c/u
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.tempId)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartItemQuantity(item.tempId, item.quantity - 1)}
                        className="h-6 w-6 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartItemQuantity(item.tempId, item.quantity + 1)}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {item.menu_item.has_cooking_point && cookingPoints && (
                      <div className="space-y-1">
                        <Label className="text-xs flex items-center gap-1">
                          <ChefHat className="h-3 w-3" />
                          Punto de cocción
                        </Label>
                        <div className="flex gap-1 flex-wrap">
                          {cookingPoints.map((point) => (
                            <Button
                              key={point.id}
                              variant={item.cooking_point_id === point.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateCartItemCookingPoint(item.tempId, point.id)}
                              className="text-xs h-6"
                            >
                              {point.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.menu_item.has_sides && sides && sides.length > 0 && (
                      <div className="space-y-1">
                        <Label className="text-xs flex items-center gap-1">
                          <Utensils className="h-3 w-3" />
                          Acompañamientos ({(item.sides || []).length}/{item.menu_item.max_sides_count})
                        </Label>
                        <div className="flex gap-1 flex-wrap">
                          {sides.map((side) => {
                            const isSelected = (item.sides || []).includes(side.id)
                            const canSelect = (item.sides || []).length < item.menu_item.max_sides_count
                            return (
                              <Button
                                key={side.id}
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleSideForItem(item.tempId, side.id)}
                                className="text-xs h-6"
                                disabled={!isSelected && !canSelect}
                              >
                                {side.name}
                              </Button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label className="text-xs">Notas</Label>
                      <Input
                        placeholder="Notas especiales..."
                        value={item.notes || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCartItemNotes(item.tempId, e.target.value)}
                        className="h-6 text-xs"
                      />
                    </div>

                    <div className="text-right">
                      <span className="font-semibold text-sm">
                        {formatCurrency(item.menu_item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-lg">
                  {formatCurrency(calculateCartTotal())}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onCancel} className="flex-1">
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateOrder}
                    disabled={cart.length === 0 || createOrder.isPending || addOrderItem.isPending}
                    className="flex-1"
                  >
                    Crear Orden
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Confirmation Modal */}
      <OrderConfirmationModal
        open={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleConfirmOrder}
        cart={cart}
        dinersCount={dinersCount}
        orderNotes={notes}
        cookingPoints={cookingPoints}
        isLoading={createOrder.isPending || addOrderItem.isPending}
        title="Confirmar Nueva Orden"
        confirmButtonText="Crear Orden"
      />
    </div>
  )
}