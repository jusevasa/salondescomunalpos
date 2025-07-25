import { CheckCircle, AlertCircle, Clock, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { usePrintServices } from '@/features/shared/hooks/usePrintServices'

interface PrintStatusIndicatorProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function PrintStatusIndicator({ 
  className = '',
  showText = true,
  size = 'md'
}: PrintStatusIndicatorProps) {
  const { 
    isServiceAvailable, 
    isCheckingService, 
    serviceError,
    isPrinting,
    orderError,
    invoiceError
  } = usePrintServices()

  const getStatusConfig = () => {
    if (isCheckingService) {
      return {
        icon: Clock,
        text: 'Verificando...',
        variant: 'secondary' as const,
        color: 'text-gray-500'
      }
    }

    if (serviceError || !isServiceAvailable) {
      return {
        icon: WifiOff,
        text: 'Servicio no disponible',
        variant: 'destructive' as const,
        color: 'text-red-500'
      }
    }

    if (orderError || invoiceError) {
      return {
        icon: AlertCircle,
        text: 'Error en impresión',
        variant: 'destructive' as const,
        color: 'text-red-500'
      }
    }

    if (isPrinting) {
      return {
        icon: Clock,
        text: 'Imprimiendo...',
        variant: 'secondary' as const,
        color: 'text-blue-500'
      }
    }

    return {
      icon: CheckCircle,
      text: 'Servicio disponible',
      variant: 'default' as const,
      color: 'text-green-500'
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }[size]

  if (!showText) {
    return (
      <div className={`flex items-center ${className}`}>
        <Icon className={`${iconSize} ${config.color}`} />
      </div>
    )
  }

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${className}`}>
      <Icon className={iconSize} />
      <span className="text-xs">{config.text}</span>
    </Badge>
  )
}