"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  disableFuture?: boolean
  defaultMonth?: Date
}

export function DatePicker({
  date,
  onSelect,
  placeholder = "Seleccionar fecha",
  disabled = false,
  className,
  disableFuture = false,
  defaultMonth
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: es }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          initialFocus
          defaultMonth={defaultMonth}
          disabled={disableFuture ? { after: new Date() } : undefined}
        />
      </PopoverContent>
    </Popover>
  )
}

interface DateRangePickerProps {
  dateFrom?: Date
  dateTo?: Date
  onSelectFrom?: (date: Date | undefined) => void
  onSelectTo?: (date: Date | undefined) => void
  placeholderFrom?: string
  placeholderTo?: string
  disabled?: boolean
  className?: string
  disableFuture?: boolean
}

export function DateRangePicker({
  dateFrom,
  dateTo,
  onSelectFrom,
  onSelectTo,
  placeholderFrom = "Fecha desde",
  placeholderTo = "Fecha hasta",
  disabled = false,
  className,
  disableFuture = false
}: DateRangePickerProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
      <DatePicker
        date={dateFrom}
        onSelect={onSelectFrom}
        placeholder={placeholderFrom}
        disabled={disabled}
        className="flex-1"
        disableFuture={disableFuture}
        defaultMonth={(dateFrom ?? dateTo) || new Date()}
      />
      <DatePicker
        date={dateTo}
        onSelect={onSelectTo}
        placeholder={placeholderTo}
        disabled={disabled}
        className="flex-1"
        disableFuture={disableFuture}
        defaultMonth={(dateTo ?? dateFrom) || new Date()}
      />
    </div>
  )
}