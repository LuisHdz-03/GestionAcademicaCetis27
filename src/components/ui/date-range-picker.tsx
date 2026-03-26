"use client";

import {
  format,
  isAfter,
  isBefore,
  isValid,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
} from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronRight } from "lucide-react";
import * as React from "react";
import type { DateRange as ReactDayPickerRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DateRange = ReactDayPickerRange;

export interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
  dateRange?: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  minDate?: Date | string;
  maxDate?: Date | string;
  placeholder?: string;
  numberOfMonths?: number;
  showNavigation?: boolean;
  disabled?: boolean;
  defaultOpen?: boolean;
}

const PRESETS = [
  {
    label: "Hoy",
    range: (): DateRange => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Ayer",
    range: (): DateRange => {
      const ayer = subDays(new Date(), 1);
      return { from: startOfDay(ayer), to: endOfDay(ayer) };
    },
  },
  {
    label: "Esta semana",
    range: (): DateRange => ({
      from: startOfWeek(new Date(), { locale: es }),
      to: endOfWeek(new Date(), { locale: es }),
    }),
  },
  {
    label: "Este mes",
    range: (): DateRange => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
];

const formatFecha = (date: Date) =>
  format(date, "d 'de' MMM, yyyy", { locale: es });

export function DatePickerWithRange({
  dateRange,
  onDateRangeChange,
  className,
  minDate,
  maxDate,
  placeholder = "Seleccionar período",
  numberOfMonths = 2,
  ...props
}: DatePickerWithRangeProps) {
  const [open, setOpen] = React.useState(props.defaultOpen ?? false);

  const handleSelect = (range: ReactDayPickerRange | undefined) => {
    if (!range) {
      onDateRangeChange(undefined);
      return;
    }

    let { from, to } = range;
    if (from && !isValid(from)) from = undefined;
    if (to && !isValid(to)) to = undefined;

    if (minDate && from && isBefore(from, startOfDay(minDate))) {
      from = startOfDay(minDate);
    }
    if (maxDate && to && isAfter(to, endOfDay(maxDate))) {
      to = endOfDay(maxDate);
    }
    if (from && to && isAfter(from, to)) {
      [from, to] = [to, from];
    }

    onDateRangeChange({ from, to });
    if (from && to) setOpen(false);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "min-w-[240px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
            {dateRange?.from ? (
              dateRange.to ? (
                <span className="flex items-center gap-1 text-sm">
                  <span className="font-medium">
                    {formatFecha(dateRange.from)}
                  </span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">
                    {formatFecha(dateRange.to)}
                  </span>
                </span>
              ) : (
                <span className="text-sm font-medium">
                  {formatFecha(dateRange.from)}
                </span>
              )
            ) : (
              <span className="text-sm">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0 shadow-xl border" align="start">
          {/* Encabezado */}
          <div className="px-4 pt-3 pb-2 border-b bg-gray-50 rounded-t-md">
            <p className="text-sm font-semibold text-gray-700">
              Seleccionar período
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {dateRange?.from
                ? dateRange.to
                  ? `${formatFecha(dateRange.from)} — ${formatFecha(dateRange.to)}`
                  : `Desde ${formatFecha(dateRange.from)} · Elige fecha final`
                : "Elige una fecha de inicio y fin"}
            </p>
          </div>

          <div className="flex">
            {/* Presets rápidos */}
            <div className="flex flex-col gap-0.5 p-3 border-r min-w-[130px] bg-gray-50/50">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Acceso rápido
              </p>
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="justify-start text-left text-xs h-8 px-2 hover:bg-[#691C32]/10 hover:text-[#691C32] font-normal"
                  onClick={() => {
                    onDateRangeChange(preset.range());
                    setOpen(false);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
              <div className="mt-2 pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-left text-xs h-8 px-2 w-full text-muted-foreground hover:text-red-600 hover:bg-red-50 font-normal"
                  onClick={() => {
                    onDateRangeChange(undefined);
                    setOpen(false);
                  }}
                >
                  Limpiar
                </Button>
              </div>
            </div>

            {/* Calendario */}
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from || new Date()}
              selected={dateRange}
              onSelect={handleSelect}
              numberOfMonths={Math.min(Math.max(1, numberOfMonths), 3)}
              locale={es}
              disabled={(date: Date) => {
                const min =
                  typeof minDate === "string" ? parseISO(minDate) : minDate;
                const max =
                  typeof maxDate === "string" ? parseISO(maxDate) : maxDate;
                if (min && isBefore(date, startOfDay(min))) return true;
                if (max && isAfter(date, endOfDay(max))) return true;
                return false;
              }}
              classNames={{
                selected:
                  "[&>button]:!bg-[#691C32] [&>button]:!text-white [&>button]:hover:!bg-[#8B2542] [&>button]:rounded-full",
                today:
                  "[&>button]:bg-gray-100 [&>button]:font-bold [&>button]:!text-[#691C32]",
                range_start: "bg-[#691C32]/15 rounded-l-full",
                range_end: "bg-[#691C32]/15 rounded-r-full",
                range_middle:
                  "bg-[#691C32]/10 [&>button]:!bg-transparent [&>button]:!text-gray-800 [&>button]:rounded-none",
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
