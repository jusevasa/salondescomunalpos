import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, ShoppingCart, X, Edit, Search, ChefHat, Utensils } from 'lucide-react'
import { useOrderManagement } from '../hooks/useOrderManagement'
import { useMenuData } from '../hooks/useMenuData'
import { useOrderById } from '../hooks/useOrderById'
import { formatCurrency } from '@/lib/utils'
import OrderConfirmationModal from './OrderConfirmationModal'
import type { MenuItem, AddOrderItemData, OrderItem, Side } from '../types'

interface EditOrderFormProps {
  orderId: number
  onSuccess: () => void
  onCancel: () => void
}

interface CartItem extends AddOrderItemData {
  menu_item: MenuItem
  tempId: string
  isExisting?: boolean
  orderItemId?: number
  selectedSides?: Side[]
}

export default function EditOrderForm({ orderId, onSuccess, onCancel }: EditOrderFormProps) {
  const [dinersCount, setDinersCount] = useState(2)
  const [notes, setNotes] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)

  const { addOrderItem, updateOrder } = useOrderManagement()
  const { useMenuCategories, useMenuItemsSearch, useCookingPoints, useSides } = useMenuData()
  const { data: order, isLoading: orderLoading } = useOrderById(orderId)

  const { data: categories } = useMenuCategories()
  const { data: cookingPoints } = useCookingPoints()
  const { data: sides } = useSides()
  
  // Use optimized search hook that queries Supabase directly
  const { data: menuItems } = useMenuItemsSearch(
    searchTerm.trim() || undefined,
    selectedCategory || undefined
  )

  // Initialize form with order data
  useEffect(() => {
    if (order) {
      setDinersCount(order.diners_count || 2)
      setNotes(order.notes || '')
      
      // Convert existing order items to cart items
      const existingItems: CartItem[] = order.order_items?.map((item: OrderItem) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        cooking_point_id: item.cooking_point_id,
        notes: item.notes,
        menu_item: item.menu_item!,
        tempId: `existing-${item.id}`,
        isExisting: true,
        orderItemId: item.id,
        selectedSides: item.sides || [],
      })).filter(item => item.menu_item) || []
      
      setCart(existingItems)
    }
  }, [order])

  // Set default category when categories load
  useEffect(() => {
    if (categories && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id)
    }
  }, [categories, selectedCategory])

  // Use the menu items directly from the optimized search
  const filteredMenuItems = menuItems || []

  const addToCart = (menuItem: MenuItem) => {
    // Check if item already exists in cart (only for new items, not existing ones)
    const existingItemIndex = cart.findIndex(item => 
      item.menu_item_id === menuItem.id && !item.isExisting
    )
    
    if (existingItemIndex >= 0) {
      // Increment quantity of existing new item
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
        isExisting: false,
        selectedSides: [],
      }
      setCart(prev => [...prev, newItem])
    }
  }

  const toggleSideForItem = (tempId: string, sideId: number) => {
    setCart(prev => prev.map(item => {
      if (item.tempId === tempId) {
        const currentSideIds = item.selectedSides?.map(side => side.id) || []
        const isSelected = currentSideIds.includes(sideId)
        
        if (isSelected) {
          // Remove side
          return {
            ...item,
            selectedSides: item.selectedSides?.filter(side => side.id !== sideId) || []
          }
        } else {
          // Add side if under limit
          if (currentSideIds.length < (item.menu_item.max_sides_count || 0)) {
            const sideToAdd = sides?.find(side => side.id === sideId)
            if (sideToAdd) {
              return {
                ...item,
                selectedSides: [...(item.selectedSides || []), sideToAdd]
              }
            }
          }
        }
      }
      return item
    }))
  }

  const getItemQuantityInCart = (menuItemId: number): number => {
    return cart
      .filter(item => item.menu_item_id === menuItemId && !item.isExisting)
      .reduce((total, item) => total + item.quantity, 0)
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

  const handleUpdateOrder = async () => {
    if (!order) return
    setShowConfirmationModal(true)
  }

  const handleConfirmOrder = async () => {
    if (!order) return

    try {
      // Update order details
      await updateOrder.mutateAsync({
        orderId: order.id,
        data: {
          diners_count: dinersCount,
          notes,
        },
      })

      // Add new items to the order
      const newItems = cart.filter(item => !item.isExisting)
      for (const item of newItems) {
        await addOrderItem.mutateAsync({
          orderId: order.id,
          itemData: {
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            cooking_point_id: item.cooking_point_id,
            notes: item.notes,
            sides: item.selectedSides?.map(side => side.id) || [],
          },
        })
      }

      setShowConfirmationModal(false)
      onSuccess()
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando orden...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Orden no encontrada</p>
          <Button onClick={onCancel} className="mt-4">
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Menu Section */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Orden #{order.id}
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
            <CardTitle>Agregar Items al Menú</CardTitle>
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
                            <div className="flex items-center gap-1">
                              <Utensils className="h-3 w-3 text-blue-500" />
                              <span className="text-xs text-blue-500">
                                max {item.max_sides_count}
                              </span>
                            </div>
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
              Items de la Orden ({cart.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-auto space-y-3">
              {cart.map((item) => (
                <Card key={item.tempId} className={`p-3 ${item.isExisting ? 'border-blue-200 bg-blue-50' : ''}`}>
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          {item.menu_item.name}
                          {item.isExisting && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Existente
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.menu_item.price)} c/u
                        </p>
                      </div>
                      {!item.isExisting && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.tempId)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartItemQuantity(item.tempId, item.quantity - 1)}
                        className="h-6 w-6 p-0"
                        disabled={item.isExisting}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartItemQuantity(item.tempId, item.quantity + 1)}
                        className="h-6 w-6 p-0"
                        disabled={item.isExisting}
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
                              disabled={item.isExisting}
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
                          Acompañamientos ({(item.selectedSides || []).length}/{item.menu_item.max_sides_count})
                        </Label>
                        <div className="flex gap-1 flex-wrap">
                          {sides.map((side) => {
                            const isSelected = (item.selectedSides || []).some(s => s.id === side.id)
                            const canSelect = (item.selectedSides || []).length < item.menu_item.max_sides_count
                            return (
                              <Button
                                key={side.id}
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleSideForItem(item.tempId, side.id)}
                                className="text-xs h-6"
                                disabled={!isSelected && !canSelect || item.isExisting}
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
                        disabled={item.isExisting}
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

              <div className="flex gap-2">
                <Button variant="outline" onClick={onCancel} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpdateOrder}
                  disabled={addOrderItem.isPending || updateOrder.isPending}
                  className="flex-1"
                >
                  Actualizar Orden
                </Button>
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
        cart={cart.filter(item => !item.isExisting)} // Only show new items in confirmation
        dinersCount={dinersCount}
        orderNotes={notes}
        cookingPoints={cookingPoints}
        isLoading={addOrderItem.isPending || updateOrder.isPending}
        title="Confirmar Actualización de Orden"
        confirmButtonText="Actualizar Orden"
      />
    </div>
  )
}