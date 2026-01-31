"use client";

import { useFormContext, Controller } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useClassesContext } from "@/lib/context/classes-context";
import { Skeleton } from "@/components/ui/skeleton";

interface ClassDropdownProps {
  name?: string;
  label?: string;
  rules?: any;
}

export function ClassDropdown({
  name = "classId",
  label = "Class",
  rules,
}: ClassDropdownProps) {
  const { control } = useFormContext();
  const { classes, isLoading } = useClassesContext();

  const classOptions =
    classes?.map((cls) => ({
      value: cls.id,
      label: cls.division ? `${cls.grade}-${cls.division}` : cls.grade,
    })) || [];

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { value, onChange }, fieldState: { error } }) => (
          <>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={value} onValueChange={onChange}>
                <SelectTrigger className={error ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {error && <p className="text-sm text-red-500">{error.message}</p>}
          </>
        )}
      />
    </div>
  );
}

