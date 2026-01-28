"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-full max-w-md p-4 bg-white rounded-lg shadow-md", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-6 sm:space-x-6 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-between items-center py-2 px-1 relative",
        caption_label: "text-base font-semibold text-gray-900",
        nav: "flex items-center space-x-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-transparent p-0 hover:bg-gray-100 rounded-full"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex justify-between mb-2",
        head_cell: "text-gray-500 text-xs font-medium w-9 h-9 flex items-center justify-center",
        row: "flex w-full justify-between mt-1",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-gray-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal rounded-full hover:bg-gray-100 aria-selected:opacity-100"
        ),
        day_selected:
          "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white",
        day_today: "bg-gray-100 text-gray-900 font-medium",
        day_outside: "text-gray-400 opacity-50",
        day_disabled: "text-gray-300",
        day_range_middle: "bg-gray-100 text-gray-900",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        prevButton: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        nextButton: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }