"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarScreen } from "@/components/calendar/calendar-screen";
import {
  useDeleteCalendarEvent,
  useDeleteHoliday,
} from "@/lib/hooks/use-calendar";
import { useToast } from "@/hooks/use-toast";

export default function CalendarPage() {
  const router = useRouter();
  const { toast } = useToast();
  const deleteCalendarEvent = useDeleteCalendarEvent();
  const deleteHoliday = useDeleteHoliday();

  const handleEdit = useCallback(
    (item: any) => {
      sessionStorage.setItem("editingCalendarItem", JSON.stringify(item));
      router.push(`/admin/calendar/${item.id}/edit`);
    },
    [router]
  );

  const handleDelete = useCallback(
    async (item: any) => {
      if (!confirm(`Are you sure you want to delete this ${item.dateType ? "event" : "holiday"}?`)) {
        return;
      }

      try {
        const isHoliday = !item.dateType;
        if (isHoliday) {
          await deleteHoliday.mutateAsync(item.id);
        } else {
          await deleteCalendarEvent.mutateAsync(item.id);
        }
        toast({
          title: "Success",
          description: "Item deleted successfully!",
          variant: "default",
        });
      } catch (error: any) {
        console.error("Delete failed:", error);
        toast({
          title: "Error",
          description: error?.message || "Failed to delete item. Please try again.",
          variant: "destructive",
        });
      }
    },
    [deleteCalendarEvent, deleteHoliday, toast]
  );

  return (
    <div className="container mx-auto py-6 px-4">
      <CalendarScreen onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
}

