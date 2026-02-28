"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  from: string;
  till: string;
  dateType: string;
}

interface CalendarHoliday {
  id: string;
  title: string;
  from: string;
  till: string;
}

interface CalendarWidgetProps {
  events?: CalendarEvent[];
  holidays?: CalendarHoliday[];
  currentMonth?: number;
  currentYear?: number;
}

export function CalendarWidget({ events = [], holidays = [], currentMonth, currentYear }: CalendarWidgetProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [displayMonth, setDisplayMonth] = useState(() => {
    if (currentMonth && currentYear) {
      return new Date(currentYear, currentMonth - 1, 1);
    }
    return new Date();
  });

  const monthStart = startOfMonth(displayMonth);
  const monthEnd = endOfMonth(displayMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week for the month
  const firstDayOfWeek = monthStart.getDay();
  const daysBeforeMonth = Array.from({ length: firstDayOfWeek }, (_, i) => null);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return events.filter((event) => {
      const eventFrom = new Date(event.from);
      const eventTill = new Date(event.till);
      return endOfDay >= eventFrom && startOfDay <= eventTill;
    });
  };

  const getHolidaysForDate = (date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return holidays.filter((holiday) => {
      const holidayFrom = new Date(holiday.from);
      const holidayTill = new Date(holiday.till);
      return endOfDay >= holidayFrom && startOfDay <= holidayTill;
    });
  };

  const handlePreviousMonth = () => {
    setDisplayMonth(subMonths(displayMonth, 1));
  };

  const handleNextMonth = () => {
    setDisplayMonth(addMonths(displayMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleManageCalendar = () => {
    router.push("/admin/calendar");
  };

  return (
    <Card className="relative isolate transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {format(displayMonth, "MMMM yyyy")}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 transition-all hover:bg-gray-100 hover:scale-110"
              onClick={handlePreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 transition-all hover:bg-gray-100 hover:scale-110"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
            <div key={day} className={cn("text-center text-xs font-medium py-1", i === 0 || i === 6 ? "text-red-500" : "text-gray-500")}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells before month starts */}
          {daysBeforeMonth.map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Days of the month */}
          {daysInMonth.map((date) => {
            const dateEvents = getEventsForDate(date);
            const dateHolidays = getHolidaysForDate(date);
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isHoliday = dateHolidays.length > 0;

            return (
              <button
                key={date.toISOString()}
                id={`calendar-widget-day-${format(date, "yyyy-MM-dd")}`}
                onClick={() => handleDateClick(date)}
                className={cn(
                  "aspect-square rounded-md text-sm transition-all duration-200 relative flex flex-col items-center justify-center",
                  "hover:bg-gray-100 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary",
                  isToday && "bg-schooliat-tint/30 font-semibold ring-2 ring-primary",
                  isSelected && !isToday && "bg-primary text-white scale-105 z-10 shadow-sm",
                  isHoliday && !isToday && !isSelected && "bg-red-50 font-bold",
                  isWeekend && !isToday && !isSelected && !isHoliday && "bg-red-50/30",
                  !isToday && !isSelected && !isHoliday && !isWeekend && "hover:bg-gray-50"
                )}
              >
                <span className={cn(
                  isToday && "text-primary",
                  isSelected && !isToday && "text-white",
                  isHoliday && !isToday && !isSelected && "text-red-600",
                  isWeekend && !isToday && !isSelected && !isHoliday && "text-red-500",
                  !isToday && !isSelected && !isWeekend && !isHoliday && "text-gray-700"
                )}>
                  {format(date, "d")}
                </span>
                <div className="flex gap-0.5 mt-1">
                  {dateEvents.length > 0 && (
                    <div className={cn("w-1 h-1 rounded-full", isSelected ? "bg-white" : "bg-primary")} />
                  )}
                  {isHoliday && (
                    <div className={cn("w-1 h-1 rounded-full", isSelected ? "bg-white" : "bg-red-500")} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Manage Calendar button */}
        <Button
          variant="outline"
          className="w-full mt-4 transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-md hover:-translate-y-0.5"
          onClick={handleManageCalendar}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Manage Calendar
        </Button>
      </CardContent>
    </Card>
  );
}

