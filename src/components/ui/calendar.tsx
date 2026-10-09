import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <div className={cn("calendar-wrapper p-3 sm:p-5 rounded-2xl bg-white shadow-md border border-[#0F2A1F]/10", className)}>
      <DayPicker
        showOutsideDays={showOutsideDays}
        className="w-full flex justify-center"
        classNames={{
          months: "flex flex-col sm:flex-row gap-4",
          month: "space-y-4",
          month_caption: "flex justify-center pt-1 relative items-center font-display font-semibold text-lg text-[#0F2A1F]",
          nav: "space-x-1 flex items-center justify-between absolute w-full px-2 top-2 z-10",
          button_previous: "w-8 h-8 bg-transparent p-0 opacity-70 hover:opacity-100 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer text-[#0F2A1F]",
          button_next: "w-8 h-8 bg-transparent p-0 opacity-70 hover:opacity-100 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer text-[#0F2A1F]",
          month_grid: "w-full border-collapse space-y-1",
          weekdays: "flex justify-between mb-2",
          weekday: "text-[#58695F] rounded-md w-9 sm:w-11 font-medium text-xs sm:text-sm text-center uppercase tracking-wider",
          week: "flex w-full justify-between mt-1",
          day: "w-9 h-9 sm:w-11 sm:h-11 text-center text-sm p-0 relative flex items-center justify-center",
          day_button: "w-full h-full rounded-full transition-all duration-200 hover:bg-[#D4A72C]/20 font-medium text-[#13201A] flex items-center justify-center cursor-pointer",
          selected: "!bg-[#D4A72C] !text-[#0F2A1F] font-bold shadow-md shadow-[#D4A72C]/40 scale-105",
          today: "border-2 border-[#D4A72C] font-bold text-[#0F2A1F]",
          outside: "text-gray-300 opacity-40",
          disabled: "text-gray-300 opacity-40 cursor-not-allowed hover:bg-transparent",
          ...classNames,
        }}
        {...props}
      />
    </div>
  );
}
