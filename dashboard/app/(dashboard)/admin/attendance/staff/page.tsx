"use client";

import { useState, useCallback, useMemo } from "react";
import { useStaffPage } from "@/lib/hooks/use-staff";
import { useTeachersPage } from "@/lib/hooks/use-teachers";
import { useAttendance, useMarkBulkAttendance } from "@/lib/hooks/use-attendance";
import { useClassesContext } from "@/lib/context/classes-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY";

interface StaffMember {
    id: string;
    firstName: string;
    lastName?: string;
    role?: { name: string };
    email?: string;
    contact?: string;
}

export default function StaffAttendancePage() {
    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
    const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({});

    // Fetch staff & teacher lists (high limit to get all)
    const { data: staffData, isLoading: staffLoading } = useStaffPage(1, 500);
    const { data: teachersData, isLoading: teachersLoading } = useTeachersPage(1, 500);

    // Get default class for attendance (required by schema)
    const { classes } = useClassesContext();
    const defaultClassId = classes?.[0]?.id || "";

    // Fetch existing attendance for the date
    const { data: attendanceData, isLoading: attendanceLoading, refetch } = useAttendance({
        date: selectedDate,
    });

    const markBulkAttendance = useMarkBulkAttendance();

    // Merge staff + teachers into one list
    const allStaff: StaffMember[] = useMemo(() => {
        const staffList = (staffData?.data || []).map((s: any) => ({
            ...s,
            _role: "STAFF",
        }));
        const teacherList = (teachersData?.data || []).map((t: any) => ({
            ...t,
            _role: "TEACHER",
        }));
        return [...teacherList, ...staffList];
    }, [staffData, teachersData]);

    // Build initial status map from existing attendance data
    const existingAttendance = attendanceData?.data || [];

    // Get the effective status for a staff member
    const getStatus = (staffId: string): AttendanceStatus | null => {
        if (statusMap[staffId]) return statusMap[staffId];
        const existing = existingAttendance.find((a: any) => a.studentId === staffId);
        return existing?.status || null;
    };

    const toggleStatus = (staffId: string, status: AttendanceStatus) => {
        setStatusMap((prev) => ({
            ...prev,
            [staffId]: prev[staffId] === status ? "PRESENT" : status,
        }));
    };

    const setAllStatus = (status: AttendanceStatus) => {
        const newMap: Record<string, AttendanceStatus> = {};
        allStaff.forEach((s) => {
            newMap[s.id] = status;
        });
        setStatusMap(newMap);
    };

    const handleSave = useCallback(async () => {
        if (!defaultClassId) {
            toast.error("No classes found. Please create at least one class first.");
            return;
        }

        const entries = Object.entries(statusMap);
        if (entries.length === 0) {
            toast.error("No attendance changes to save");
            return;
        }

        try {
            const attendances = entries.map(([staffId, status]) => ({
                studentId: staffId,
                classId: defaultClassId,
                date: selectedDate,
                status,
            }));

            await markBulkAttendance.mutateAsync({ attendances });
            toast.success(`Saved attendance for ${entries.length} staff members`);
            setStatusMap({});
            refetch();
        } catch (error: any) {
            toast.error(error?.message || "Failed to save attendance");
        }
    }, [statusMap, defaultClassId, selectedDate, markBulkAttendance, refetch]);

    const isLoading = staffLoading || teachersLoading;
    const changedCount = Object.keys(statusMap).length;

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Staff & Teacher Attendance</h1>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setAllStatus("PRESENT")}
                        className="gap-2 text-green-700 border-green-300 hover:bg-green-50"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Mark All Present
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setAllStatus("ABSENT")}
                        className="gap-2 text-red-700 border-red-300 hover:bg-red-50"
                    >
                        <XCircle className="h-4 w-4" />
                        Mark All Absent
                    </Button>
                </div>
            </div>

            {/* Date Picker */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    setStatusMap({});
                                }}
                                className="w-48"
                            />
                        </div>
                        <div className="mt-6 text-sm text-gray-500">
                            {allStaff.length} staff & teachers found
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Staff List */}
            {isLoading ? (
                <Card>
                    <CardContent className="pt-6">
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
            ) : allStaff.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-12 text-gray-500">
                            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p>No staff or teachers found</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">
                            Attendance for {format(new Date(selectedDate), "MMMM dd, yyyy")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left text-sm text-gray-500">
                                        <th className="pb-3 pr-4 font-medium w-12">#</th>
                                        <th className="pb-3 pr-4 font-medium">Name</th>
                                        <th className="pb-3 pr-4 font-medium">Role</th>
                                        <th className="pb-3 font-medium text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allStaff.map((member, idx) => {
                                        const currentStatus = getStatus(member.id);
                                        return (
                                            <tr key={member.id} className="border-b last:border-0 hover:bg-gray-50/50">
                                                <td className="py-3 pr-4 text-sm text-gray-500">{idx + 1}</td>
                                                <td className="py-3 pr-4">
                                                    <div className="font-medium text-gray-900">
                                                        {member.firstName} {member.lastName || ""}
                                                    </div>
                                                    {member.email && (
                                                        <div className="text-xs text-gray-400">{member.email}</div>
                                                    )}
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <span className={cn(
                                                        "text-xs font-medium px-2 py-1 rounded-full",
                                                        (member as any)._role === "TEACHER"
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-purple-100 text-purple-700"
                                                    )}>
                                                        {(member as any)._role === "TEACHER" ? "Teacher" : "Staff"}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleStatus(member.id, "PRESENT")}
                                                            className={cn(
                                                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                                                currentStatus === "PRESENT"
                                                                    ? "bg-green-600 text-white shadow-sm"
                                                                    : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700"
                                                            )}
                                                        >
                                                            Present
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleStatus(member.id, "ABSENT")}
                                                            className={cn(
                                                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                                                currentStatus === "ABSENT"
                                                                    ? "bg-red-600 text-white shadow-sm"
                                                                    : "bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-700"
                                                            )}
                                                        >
                                                            Absent
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleStatus(member.id, "LATE")}
                                                            className={cn(
                                                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                                                currentStatus === "LATE"
                                                                    ? "bg-yellow-500 text-white shadow-sm"
                                                                    : "bg-gray-100 text-gray-500 hover:bg-yellow-100 hover:text-yellow-700"
                                                            )}
                                                        >
                                                            Late
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleStatus(member.id, "HALF_DAY")}
                                                            className={cn(
                                                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                                                currentStatus === "HALF_DAY"
                                                                    ? "bg-orange-500 text-white shadow-sm"
                                                                    : "bg-gray-100 text-gray-500 hover:bg-orange-100 hover:text-orange-700"
                                                            )}
                                                        >
                                                            Half Day
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Save Button */}
                        <div className="mt-6 flex items-center justify-between border-t pt-4">
                            <p className="text-sm text-gray-500">
                                {changedCount > 0 ? `${changedCount} change(s) pending` : "No changes"}
                            </p>
                            <Button
                                onClick={handleSave}
                                disabled={changedCount === 0 || markBulkAttendance.isPending}
                                className="bg-[#4b830d] hover:bg-[#3a6a0a] text-white gap-2"
                            >
                                {markBulkAttendance.isPending ? (
                                    <Clock className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                )}
                                Save Attendance
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
