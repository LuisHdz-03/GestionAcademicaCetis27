"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 relative", className)}
      classNames={{
        // Layout
        months: "flex flex-col sm:flex-row gap-6",
        month: "space-y-3",
        month_caption: "flex justify-center items-center relative min-h-9 pt-1",
        caption_label: "text-sm font-semibold text-gray-800",
        nav: "flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "absolute left-0 h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 flex items-center justify-center",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "absolute right-0 h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 flex items-center justify-center",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-gray-400 text-xs font-medium w-9 h-8 flex items-center justify-center",
        week: "flex w-full mt-1",
        day: "relative h-9 w-9 p-0 text-center text-sm",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal rounded-full hover:bg-gray-100",
        ),
        // States
        selected:
          "[&>button]:!bg-blue-600 [&>button]:!text-white [&>button]:hover:!bg-blue-700 [&>button]:rounded-full",
        today: "[&>button]:bg-gray-100 [&>button]:font-bold",
        outside: "opacity-40",
        disabled: "opacity-30 pointer-events-none",
        // Range
        range_start: "bg-blue-100 rounded-l-full",
        range_end: "bg-blue-100 rounded-r-full",
        range_middle:
          "bg-blue-50 [&>button]:!bg-transparent [&>button]:!text-gray-800 [&>button]:rounded-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
