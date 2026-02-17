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

interface CalendarWidgetProps {
  events?: CalendarEvent[];
  currentMonth?: number;
  currentYear?: number;
}

export function CalendarWidget({ events = [], currentMonth, currentYear }: CalendarWidgetProps) {
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
    return events.filter((event) => {
      const eventFrom = new Date(event.from);
      const eventTill = new Date(event.till);
      return date >= eventFrom && date <= eventTill;
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
            <CalendarIcon className="h-5 w-5 text-[#678d3d]" />
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
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
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
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());

            return (
              <button
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className={cn(
                  "aspect-square rounded-md text-sm transition-all duration-200 relative",
                  "hover:bg-gray-100 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500",
                  isToday && "bg-green-100 font-semibold ring-2 ring-green-400",
                  isSelected && !isToday && "bg-green-200 scale-105",
                  !isToday && !isSelected && "hover:bg-gray-50"
                )}
              >
                <span className={cn(
                  isToday && "text-green-700",
                  isSelected && !isToday && "text-green-800",
                  !isToday && !isSelected && "text-gray-700"
                )}>
                  {format(date, "d")}
                </span>
                {dateEvents.length > 0 && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className="w-1 h-1 rounded-full bg-green-600" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Manage Calendar button */}
        <Button
          variant="outline"
          className="w-full mt-4 transition-all duration-300 hover:bg-[#678d3d] hover:text-white hover:shadow-md hover:-translate-y-0.5"
          onClick={handleManageCalendar}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Manage Calendar
        </Button>
      </CardContent>
    </Card>
  );
}

