import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Utensils } from 'lucide-react'
import { useMenuData } from '../hooks/useMenuData'
import type { Side } from '../types'

interface SideSelectorProps {
  menuItemId: number
  maxSidesCount: number
  selectedSides: Side[]
  onSideToggle: (sideId: number, side: Side) => void
  disabled?: boolean
}

export default function SideSelector({
  menuItemId,
  maxSidesCount,
  selectedSides,
  onSideToggle,
  disabled = false
}: SideSelectorProps) {
  const { useItemSides } = useMenuData()
  const { data: availableSides, isLoading, error } = useItemSides(menuItemId)

  if (isLoading) {
    return (
      <div className="space-y-1">
        <Label className="text-xs flex items-center gap-1">
          <Utensils className="h-3 w-3" />
          Cargando acompañamientos...
        </Label>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-1">
        <Label className="text-xs flex items-center gap-1 text-red-500">
          <Utensils className="h-3 w-3" />
          Error cargando acompañamientos
        </Label>
      </div>
    )
  }

  if (!availableSides || availableSides.length === 0) {
    return (
      <div className="space-y-1">
        <Label className="text-xs flex items-center gap-1 text-gray-500">
          <Utensils className="h-3 w-3" />
          No hay acompañamientos disponibles para este ítem
        </Label>
      </div>
    )
  }

  const selectedSideIds = selectedSides.map(side => side.id)
  const canSelectMore = selectedSides.length < maxSidesCount

  return (
    <div className="space-y-1">
      <Label className="text-xs flex items-center gap-1">
        <Utensils className="h-3 w-3" />
        Acompañamientos ({selectedSides.length}/{maxSidesCount})
      </Label>
      <div className="flex gap-1 flex-wrap">
        {availableSides.map((side) => {
          const isSelected = selectedSideIds.includes(side.id)
          return (
            <Button
              key={side.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onSideToggle(side.id, side)}
              className="text-xs h-6"
              disabled={disabled || (!isSelected && !canSelectMore)}
            >
              {side.name}
            </Button>
          )
        })}
      </div>
    </div>
  )
}