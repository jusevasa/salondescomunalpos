import { format, startOfDay, endOfDay, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Formatea una fecha usando el locale español
 */
export const formatDate = (date: Date | string, formatStr: string = 'dd/MM/yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  
  if (!isValid(dateObj)) {
    return ''
  }
  
  return format(dateObj, formatStr, { locale: es })
}

/**
 * Formatea una fecha para mostrar en formato legible
 */
export const formatDateDisplay = (date: Date | string): string => {
  return formatDate(date, 'dd \'de\' MMMM \'de\' yyyy')
}

/**
 * Formatea una fecha y hora para mostrar en formato legible
 */
export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, 'dd/MM/yyyy HH:mm')
}

/**
 * Formatea una fecha para input de tipo date (YYYY-MM-DD)
 */
export const formatDateForInput = (date: Date | string): string => {
  return formatDate(date, 'yyyy-MM-dd')
}

/**
 * Obtiene el inicio del día para una fecha
 */
export const getStartOfDay = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return startOfDay(dateObj)
}

/**
 * Obtiene el final del día para una fecha
 */
export const getEndOfDay = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return endOfDay(dateObj)
}

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD
 */
export const getTodayString = (): string => {
  return formatDateForInput(new Date())
}

/**
 * Convierte una fecha string a Date object de forma segura
 */
export const parseDate = (dateString: string): Date | null => {
  const date = parseISO(dateString)
  return isValid(date) ? date : null
}

/**
 * Obtiene el rango de fechas para consultas de base de datos
 * Incluye el día completo (00:00:00 - 23:59:59)
 */
export const getDateRange = (dateFrom: string, dateTo: string) => {
  const startDate = `${dateFrom} 00:00:00`
  const endDate = `${dateTo} 23:59:59`
  
  return {
    startDate,
    endDate,
    startOfDay: getStartOfDay(dateFrom),
    endOfDay: getEndOfDay(dateTo)
  }
}

/**
 * Valida si una fecha string es válida
 */
export const isValidDateString = (dateString: string): boolean => {
  const date = parseISO(dateString)
  return isValid(date)
}