"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ClassItem } from "@/lib/schemas/class-schema";

const GRADE_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

const DIVISION_OPTIONS = ["A", "B", "C", "D", "E", "F"].map((div) => ({
  value: div,
  label: div,
}));

interface ClassFormTableProps {
  classes: ClassItem[];
  teachers: Array<{ id: string; firstName: string; lastName: string }>;
  errors: Record<string, string>;
  onChange: (classes: ClassItem[]) => void;
  onFieldChange: (index: number, field: keyof ClassItem, value: any) => void;
}

export function ClassFormTable({
  classes,
  teachers,
  errors,
  onChange,
  onFieldChange,
}: ClassFormTableProps) {
  const addRow = () => {
    onChange([
      ...classes,
      { id: null, grade: "", division: "", classTeacherId: null },
    ]);
  };

  const removeRow = (index: number) => {
    if (classes.length > 1) {
      onChange(classes.filter((_, i) => i !== index));
    }
  };

  const teacherOptions = teachers.map((teacher) => ({
    value: teacher.id,
    label: `${teacher.firstName} ${teacher.lastName}`,
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Class Information</h3>
        <Button type="button" onClick={addRow} variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add New Class
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[180px]">
                  Grade *
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[180px]">
                  Division *
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[220px]">
                  Class Teacher
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[60px]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls, index) => (
                <tr key={cls.id || index} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Select
                      value={cls.grade || ""}
                      onValueChange={(value) => onFieldChange(index, "grade", value)}
                    >
                      <SelectTrigger
                        className={errors[`grade_${index}`] ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Select Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors[`grade_${index}`] && (
                      <p className="text-sm text-red-500 mt-1">{errors[`grade_${index}`]}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={cls.division || ""}
                      onValueChange={(value) => onFieldChange(index, "division", value)}
                    >
                      <SelectTrigger
                        className={errors[`division_${index}`] ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Select Division" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIVISION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors[`division_${index}`] && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors[`division_${index}`]}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={cls.classTeacherId || "none"}
                      onValueChange={(value) =>
                        onFieldChange(index, "classTeacherId", value === "none" ? null : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {teacherOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    {classes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

