"use client";

import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DateInputProps {
  id: string;
  label: string;
  value: string | Date | undefined;
  onChange: (value: string) => void;
  max?: string; // YYYY-MM-DD format
  min?: string; // YYYY-MM-DD format
  required?: boolean;
  error?: string;
  className?: string;
}

// Convert YYYY-MM-DD string to Date object
const stringToDate = (dateStr: string | Date | undefined): Date | undefined => {
  if (!dateStr) return undefined;
  
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? undefined : dateStr;
  }
  
  // Assume YYYY-MM-DD format
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? undefined : date;
};

// Convert Date object to YYYY-MM-DD string
const dateToString = (date: Date | undefined): string => {
  if (!date || isNaN(date.getTime())) return "";
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}`;
};

export default function DateInput({
  id,
  label,
  value,
  onChange,
  max,
  min,
  required = false,
  error,
  className = "",
}: DateInputProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    stringToDate(value)
  );

  // Update selectedDate when value prop changes
  useEffect(() => {
    setSelectedDate(stringToDate(value));
  }, [value]);

  // Convert min/max strings to Date objects
  const minDate = min ? new Date(min) : undefined;
  const maxDate = max ? new Date(max) : undefined;

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      const dateString = dateToString(date);
      onChange(dateString);
    } else {
      setSelectedDate(undefined);
      onChange("");
    }
  };

  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id} className="text-gray-700 font-medium">
        {label} {required && "*"}
      </Label>
      <div className="relative mt-1">
        <DatePicker
          id={id}
          selected={selectedDate || null}
          onChange={handleDateChange}
          minDate={minDate}
          maxDate={maxDate}
          dateFormat="dd/MM/yyyy"
          placeholderText="Select date"
          className={cn(
            "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm",
            "focus:border-[#F87D7D] focus:outline-none focus:ring-2 focus:ring-[#F87D7D] focus:ring-offset-0",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !selectedDate && "text-gray-500",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}
          showYearDropdown
          showMonthDropdown
          dropdownMode="select"
          yearDropdownItemNumber={100}
          scrollableYearDropdown
          calendarClassName="!shadow-lg !border-gray-200"
          wrapperClassName="w-full"
        />
        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

