"use client";

import { useState, useMemo } from "react";
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
import { useClassFilters } from "@/lib/hooks/use-class-filters";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIOD_TIMES = [
  "08:00 - 08:45",
  "08:45 - 09:30",
  "09:30 - 10:00",
  "10:00 - 10:45",
  "10:45 - 11:30",
  "11:30 - 12:00",
  "12:00 - 12:45",
  "12:45 - 01:30",
];

const ROW_TEMPLATE = [
  { period: 1, time: PERIOD_TIMES[0], isBreak: false },
  { period: 2, time: PERIOD_TIMES[1], isBreak: false },
  { period: "Short Break", time: PERIOD_TIMES[2], isBreak: true },
  { period: 3, time: PERIOD_TIMES[3], isBreak: false },
  { period: 4, time: PERIOD_TIMES[4], isBreak: false },
  { period: "Long Break", time: PERIOD_TIMES[5], isBreak: true },
  { period: 5, time: PERIOD_TIMES[6], isBreak: false },
  { period: 6, time: PERIOD_TIMES[7], isBreak: false },
];

// Mock data - replace with API call
const INITIAL_TIMETABLE = ROW_TEMPLATE.map((template, i) => ({
  id: template.isBreak ? `break-${i}` : i + 1,
  ...template,
  ...Object.fromEntries(
    DAYS.map((d) => [
      d.toLowerCase(),
      template.isBreak
        ? {
            subject: template.period,
            teacher: "",
          }
        : {
            subject: "Math",
            teacher: "Mr. Sharma",
          },
    ])
  ),
}));

export function TimetableView() {
  const { classFilter, divisionFilter } = useClassFilters();
  const [classFilterValue, setClassFilterValue] = useState(classFilter.defaultValue);
  const [divisionFilterValue, setDivisionFilterValue] = useState(divisionFilter.defaultValue);
  const [timeTable, setTimeTable] = useState(INITIAL_TIMETABLE);

  const filteredTimeTable = useMemo(() => {
    return timeTable; // Add filtering logic when API is available
  }, [timeTable, classFilterValue, divisionFilterValue]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">Timetable</h1>
        <div className="flex gap-2">
          <Select value={classFilterValue} onValueChange={setClassFilterValue}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              {classFilter.options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={divisionFilterValue} onValueChange={setDivisionFilterValue}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select Division" />
            </SelectTrigger>
            <SelectContent>
              {divisionFilter.options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#e5ffc7]">
                <TableHead className="w-32">Period/Time</TableHead>
                {DAYS.map((day) => (
                  <TableHead key={day} className="min-w-[150px]">
                    {day}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTimeTable.map((row) => {
                if (row.isBreak) {
                  return (
                    <TableRow key={row.id} className="bg-gray-100">
                      <TableCell colSpan={7} className="text-center font-semibold py-3">
                        {row.period} ({row.time})
                      </TableCell>
                    </TableRow>
                  );
                }
                return (
                  <TableRow key={row.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <div>
                        <div>Period {row.period}</div>
                        <div className="text-xs text-gray-500">{row.time}</div>
                      </div>
                    </TableCell>
                    {DAYS.map((day) => {
                      const dayData = row[day.toLowerCase() as keyof typeof row] as any;
                      return (
                        <TableCell key={day} className="min-w-[150px]">
                          {dayData ? (
                            <div>
                              <div className="font-semibold">{dayData.subject}</div>
                              <div className="text-sm text-gray-600">{dayData.teacher}</div>
                            </div>
                          ) : (
                            <div className="text-gray-400">—</div>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

