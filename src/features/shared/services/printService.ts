import { validatePrintEnv } from '@/lib/config/env'
import { validateBeforeSending } from '../utils/contractValidation'
import type {
  PrintOrderRequest,
  PrintOrderResponse,
  PrintInvoiceRequest,
  PrintInvoiceResponse
} from '../types/print'

// ============================================================================
// CONFIGURACIÓN DEL SERVICIO DE IMPRESIÓN
// ============================================================================

class PrintService {
  private baseUrl: string

  constructor() {
    try {
      const { PRINT_API_URL } = validatePrintEnv()
      this.baseUrl = PRINT_API_URL
    } catch (error) {
      console.warn('Print API URL not configured:', error)
      this.baseUrl = ''
    }
  }

  // ============================================================================
  // MÉTODOS PRIVADOS PARA MANEJO DE REQUESTS
  // ============================================================================

  private async makeRequest<T>(
    endpoint: string,
    data: unknown,
    options?: RequestInit
  ): Promise<T> {
    if (!this.baseUrl) {
      throw new PrintServiceError(
        'Print API URL not configured. Please set VITE_PRINT_API_URL environment variable.',
        'MISSING_CONFIG'
      )
    }

    const url = `${this.baseUrl}${endpoint}`
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: JSON.stringify(data),
        ...options,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new PrintServiceError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.code || 'HTTP_ERROR',
          errorData
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof PrintServiceError) {
        throw error
      }

      // Error de red o parsing
      throw new PrintServiceError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NETWORK_ERROR',
        error
      )
    }
  }

  // ============================================================================
  // MÉTODOS PÚBLICOS PARA IMPRESIÓN
  // ============================================================================

  /**
   * Imprime una comanda enviando los datos a las estaciones de impresión correspondientes
   */
  async printOrder(orderData: PrintOrderRequest): Promise<PrintOrderResponse> {
    try {
      // Validar contrato antes de enviar
      const validation = validateBeforeSending('order', orderData)
      if (!validation.isValid) {
        throw new PrintServiceError(
          `Datos de comanda inválidos: ${validation.errors.join(', ')}`,
          'INVALID_CONTRACT',
          { errors: validation.errors, data: orderData }
        )
      }

      console.log('🖨️ Enviando comanda para impresión:', {
        order_id: orderData.order_id,
        table_number: orderData.table_number,
        stations: orderData.print_groups.map(g => g.print_station.name)
      })

      const response = await this.makeRequest<PrintOrderResponse>(
        '/api/orders/print',
        orderData
      )

      console.log('✅ Comanda enviada exitosamente:', response)
      return response
    } catch (error) {
      console.error('❌ Error al imprimir comanda:', error)
      throw error
    }
  }

  /**
   * Imprime una factura
   */
  async printInvoice(invoiceData: PrintInvoiceRequest): Promise<PrintInvoiceResponse> {
    try {
      // Validar contrato antes de enviar
      const validation = validateBeforeSending('invoice', invoiceData)
      if (!validation.isValid) {
        throw new PrintServiceError(
          `Datos de factura inválidos: ${validation.errors.join(', ')}`,
          'INVALID_CONTRACT',
          { errors: validation.errors, data: invoiceData }
        )
      }

      console.log('🧾 Enviando factura para impresión:', {
        order_id: invoiceData.order_id,
        table_number: invoiceData.table_number,
        total: invoiceData.grand_total
      })

      const response = await this.makeRequest<PrintInvoiceResponse>(
        '/api/orders/invoice',
        invoiceData
      )

      console.log('✅ Factura enviada exitosamente:', response)
      return response
    } catch (error) {
      console.error('❌ Error al imprimir factura:', error)
      throw error
    }
  }

  // ============================================================================
  // MÉTODOS DE UTILIDAD
  // ============================================================================

  /**
   * Verifica si el servicio de impresión está disponible
   */
  async checkPrintService(): Promise<boolean> {
    if (!this.baseUrl) {
      return false
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        timeout: 5000,
      } as RequestInit)
      
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Prueba la conexión con una impresora específica
   */
  async testPrinterConnection(printerIp: string): Promise<{ success: boolean; message: string }> {
    if (!this.baseUrl) {
      throw new PrintServiceError(
        'Print API URL not configured. Please set VITE_PRINT_API_URL environment variable.',
        'MISSING_CONFIG'
      )
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/printer/test/${printerIp}`, {
        method: 'GET',
        timeout: 10000,
      } as RequestInit)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          message: errorData.message || `Error ${response.status}: ${response.statusText}`
        }
      }

      const data = await response.json()
      return {
        success: true,
        message: data.message || 'Conexión exitosa'
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error de conexión'
      }
    }
  }

  /**
   * Obtiene la configuración actual del servicio
   */
  getConfig() {
    return {
      baseUrl: this.baseUrl,
      isConfigured: !!this.baseUrl,
    }
  }
}

// ============================================================================
// CLASE DE ERROR PERSONALIZADA
// ============================================================================

class PrintServiceError extends Error {
  public code?: string
  public details?: unknown

  constructor(message: string, code?: string, details?: unknown) {
    super(message)
    this.name = 'PrintServiceError'
    this.code = code
    this.details = details
  }
}

// ============================================================================
// EXPORTACIÓN DEL SERVICIO
// ============================================================================

export const printService = new PrintService()
export { PrintServiceError }
export type { 
  PrintOrderRequest, 
  PrintOrderResponse, 
  PrintInvoiceRequest, 
  PrintInvoiceResponse,
  PrintServiceError as PrintServiceErrorType
}