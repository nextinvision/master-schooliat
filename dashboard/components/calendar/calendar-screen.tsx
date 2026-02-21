"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendarEventsPage, useHolidays } from "@/lib/hooks/use-calendar";
import { format, parse, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";

const CALENDAR_TYPES = ["Events", "Holiday"];

interface CalendarScreenProps {
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
}

export function CalendarScreen({ onEdit, onDelete }: CalendarScreenProps) {
  const [calendarType, setCalendarType] = useState("Events");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const itemsPerPage = 10;

  const monthString = format(currentMonth, "yyyy-MM");

  // Fetch events for current month
  const { data: eventsData, isLoading: isLoadingEvents } = useCalendarEventsPage(
    1,
    1000,
    monthString
  );

  // Fetch holidays for current month
  const { data: holidaysData, isLoading: isLoadingHolidays } = useHolidays(monthString);

  const events = eventsData?.data || [];
  const holidays = holidaysData?.data || [];

  // Transform data based on type
  const currentData = useMemo(() => {
    if (calendarType === "Events") {
      return events.map((event: any, index: number) => {
        let dateDisplay = "";
        if (event.dateType === "DATE_RANGE" && event.from && event.till) {
          const fromFormatted = format(new Date(event.from), "MMM d");
          const tillFormatted = format(new Date(event.till), "MMM d");
          dateDisplay = `${fromFormatted} - ${tillFormatted}`;
        } else if (event.from) {
          dateDisplay = format(new Date(event.from), "MMM d");
        }

        return {
          id: event.id,
          no: String(index + 1).padStart(2, "0"),
          name: event.title,
          date: dateDisplay,
          description: event.description,
          dateType: event.dateType,
          ...event,
        };
      });
    } else {
      return holidays.map((holiday: any, index: number) => {
        let dateDisplay = "";
        if (holiday.from && holiday.till) {
          const fromFormatted = format(new Date(holiday.from), "MMM d");
          const tillFormatted = format(new Date(holiday.till), "MMM d");
          dateDisplay =
            holiday.from !== holiday.till
              ? `${fromFormatted} - ${tillFormatted}`
              : fromFormatted;
        }

        return {
          id: holiday.id,
          no: String(index + 1).padStart(2, "0"),
          name: holiday.title,
          date: dateDisplay,
          description: "",
          ...holiday,
        };
      });
    }
  }, [calendarType, events, holidays]);

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchQuery) return currentData;
    const q = searchQuery.toLowerCase();
    return currentData.filter((item: any) => item.name?.toLowerCase().includes(q));
  }, [currentData, searchQuery]);

  // Pagination
  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, filteredData.length);
  const numberOfPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(from, to);

  useEffect(() => {
    setPage(0);
  }, [calendarType, searchQuery, currentMonth]);

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  // Get events/holidays for selected date
  const selectedDateItems = useMemo(() => {
    if (!selectedDate) return [];
    return currentData.filter((item: any) => {
      if (calendarType === "Events") {
        const fromDate = item.from ? new Date(item.from) : null;
        const tillDate = item.till ? new Date(item.till) : null;
        if (!fromDate || !tillDate) return false;
        return selectedDate >= fromDate && selectedDate <= tillDate;
      } else {
        const fromDate = item.from ? new Date(item.from) : null;
        const tillDate = item.till ? new Date(item.till) : null;
        if (!fromDate || !tillDate) return false;
        return selectedDate >= fromDate && selectedDate <= tillDate;
      }
    });
  }, [selectedDate, currentData, calendarType]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <div className="flex gap-2">
          <Select value={calendarType} onValueChange={setCalendarType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CALENDAR_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              const type = calendarType === "Events" ? "event" : "holiday";
              window.location.href = `/admin/calendar/add?type=${type}`;
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((day) => {
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const hasEvents = currentData.some((item: any) => {
                const fromDate = item.from ? new Date(item.from) : null;
                const tillDate = item.till ? new Date(item.till) : null;
                if (!fromDate || !tillDate) return false;
                return day >= fromDate && day <= tillDate;
              });

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`
                    aspect-square p-2 text-sm rounded
                    ${isSelected ? "bg-primary text-white" : "hover:bg-gray-100"}
                    ${isToday ? "ring-2 ring-blue-400" : ""}
                    ${hasEvents ? "font-semibold" : ""}
                  `}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Events */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">
            {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Today"}
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {selectedDateItems.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No {calendarType.toLowerCase()} on this date
              </p>
            ) : (
              selectedDateItems.map((item: any) => (
                <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm">{item.name}</h4>
                  {item.description && (
                    <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Search and Table */}
      <div className="space-y-4">
        <Input
          placeholder={`Search by ${calendarType === "Events" ? "Event" : "Holiday"} Name`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />

        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-schooliat-tint">
                  <TableHead className="w-16">No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-32">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No {calendarType.toLowerCase()} found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item: any) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{item.no}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {item.description || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(item)}
                            className="h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(item)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {numberOfPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {page + 1} of {numberOfPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(numberOfPages - 1, page + 1))}
                disabled={page >= numberOfPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

