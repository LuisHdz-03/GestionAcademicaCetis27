"use client";

import { format, isAfter, isBefore, isValid, parseISO, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import * as React from 'react';
import type { DateRange as ReactDayPickerRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from '@/components/ui/popover';

// Usamos el tipo DateRange de react-day-picker para mantener consistencia
type DateRange = ReactDayPickerRange;

export interface DatePickerWithRangeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Rango de fechas seleccionado actualmente
   */
  dateRange?: DateRange | undefined;
  /**
   * Callback que se ejecuta cuando se selecciona un nuevo rango de fechas
   * @param range - El nuevo rango de fechas seleccionado
   */
  onDateRangeChange: (range: DateRange | undefined) => void;
  /**
   * Fecha mínima permitida para la selección
   */
  minDate?: Date | string;
  /**
   * Fecha máxima permitida para la selección
   */
  maxDate?: Date | string;
  /**
   * Texto del placeholder cuando no hay fechas seleccionadas
   * @default 'Seleccionar rango de fechas'
   */
  placeholder?: string;
  /**
   * Número de meses a mostrar en el calendario (1-3)
   * @default 2
   */
  numberOfMonths?: number;
  /**
   * Si es true, muestra los botones de navegación
   * @default true
   */
  showNavigation?: boolean;
  /**
   * Si es true, deshabilita el componente
   * @default false
   */
  disabled?: boolean;
  /**
   * Si es true, el calendario estará abierto por defecto
   * @default false
   */
  defaultOpen?: boolean;
}

export function DatePickerWithRange({
  dateRange,
  onDateRangeChange,
  className,
  minDate,
  maxDate,
  placeholder = 'Seleccionar rango de fechas',
  numberOfMonths = 2,
  ...props
}: DatePickerWithRangeProps) {
  const [open, setOpen] = React.useState(props.defaultOpen ?? false);
  const [internalRange, setInternalRange] = React.useState<DateRange | undefined>(
    dateRange
  );

  // Sincronizar el estado interno con las props
  React.useEffect(() => {
    setInternalRange(dateRange);
  }, [dateRange]);

  const handleSelect = (range: ReactDayPickerRange | undefined) => {
    if (!range) {
      onDateRangeChange(undefined);
      return;
    }

    // Validar fechas
    let { from, to } = range;
    
    // Asegurar que las fechas sean válidas
    if (from && !isValid(from)) from = undefined;
    if (to && !isValid(to)) to = undefined;

    // Validar rango mínimo y máximo
    if (minDate && from && isBefore(from, startOfDay(minDate))) {
      from = startOfDay(minDate);
    }
    
    if (maxDate && to && isAfter(to, endOfDay(maxDate))) {
      to = endOfDay(maxDate);
    }

    // Si hay una fecha de inicio y fin, asegurarse de que from <= to
    if (from && to && isAfter(from, to)) {
      [from, to] = [to, from];
    }

    onDateRangeChange({ from, to });
    
    // Cerrar el popover solo cuando se seleccionan ambas fechas
    if (from && to) {
      setOpen(false);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date-range-picker-trigger"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal hover:bg-accent hover:text-accent-foreground",
              !dateRange && "text-muted-foreground"
            )}
            aria-label="Seleccionar rango de fechas"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="date-range-calendar"
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  <time dateTime={dateRange.from.toISOString()}>
                    {format(dateRange.from, 'PPP', { locale: es })}
                  </time>
                  {' '}al{' '}
                  <time dateTime={dateRange.to.toISOString()}>
                    {format(dateRange.to, 'PPP', { locale: es })}
                  </time>
                </>
              ) : (
                <time dateTime={dateRange.from.toISOString()}>
                  {format(dateRange.from, 'PPP', { locale: es })}
                </time>
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          id="date-range-calendar"
          className="w-auto p-0" 
          align="start"
          onInteractOutside={(event) => {
            // Evitar que el popover se cierre si se interactúa con el calendario
            const target = event.target as HTMLElement;
            if (target.closest('.rdp') || target.closest('.popover-close-button')) {
              event.preventDefault();
            }
          }}
          onEscapeKeyDown={() => setOpen(false)}
        >
          <Calendar
            id="date-range-calendar"
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from || new Date()}
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={Math.min(Math.max(1, numberOfMonths), 3)} // Limitar entre 1 y 3 meses
            locale={es}
            disabled={(date: Date) => {
              // Convertir minDate y maxDate a objetos Date si son strings
              const min = typeof minDate === 'string' ? parseISO(minDate) : minDate;
              const max = typeof maxDate === 'string' ? parseISO(maxDate) : maxDate;
              
              if (min && isBefore(date, startOfDay(min))) return true;
              if (max && isAfter(date, endOfDay(max))) return true;
              return false;
            }}
            captionLayout="dropdown"
            fromYear={minDate ? (typeof minDate === 'string' ? new Date(minDate).getFullYear() : minDate.getFullYear()) : 1900}
            toYear={maxDate ? (typeof maxDate === 'string' ? new Date(maxDate).getFullYear() : maxDate.getFullYear()) : new Date().getFullYear() + 10}
            classNames={{
              months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
              caption: 'flex justify-center pt-1 relative items-center',
              caption_label: 'text-sm font-medium',
              nav: 'space-x-1 flex items-center',
              nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
              row: 'flex w-full mt-2',
              cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
              day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground',
              day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
              day_today: 'bg-accent text-accent-foreground',
              day_outside: 'text-muted-foreground opacity-50',
              day_disabled: 'text-muted-foreground opacity-50',
              day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
              day_hidden: 'invisible',
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}