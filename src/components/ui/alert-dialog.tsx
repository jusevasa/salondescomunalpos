import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
}

const variantConfig = {
  default: {
    icon: Info,
    iconColor: "text-blue-600",
    confirmVariant: "default" as const
  },
  destructive: {
    icon: XCircle,
    iconColor: "text-red-600",
    confirmVariant: "destructive" as const
  },
  success: {
    icon: CheckCircle,
    iconColor: "text-green-600",
    confirmVariant: "default" as const
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-600",
    confirmVariant: "default" as const
  }
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  variant = 'default',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  loading = false
}: AlertDialogProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm()
    }
    onOpenChange(false)
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Icon className={cn("h-5 w-5", config.iconColor)} />
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-left">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          {onConfirm && (
            <Button
              type="button"
              variant={config.confirmVariant}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? 'Procesando...' : confirmText}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}