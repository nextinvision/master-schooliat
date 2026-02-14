"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useFile, getFileUrl } from "@/lib/hooks/use-file-upload";
import { User } from "lucide-react";
import Image from "next/image";

interface TeacherDetailModalProps {
  visible: boolean;
  onClose: () => void;
  teacher: any;
}

export function TeacherDetailModal({ visible, onClose, teacher }: TeacherDetailModalProps) {
  const fileId =
    teacher?.registrationPhotoId ||
    teacher?.photoId ||
    teacher?.fileId ||
    teacher?.avatarId;

  const { data: userFile, isLoading: loadingUserFile } = useFile(fileId, {
    enabled: !!fileId && visible && !!teacher,
  });

  const userImageUrl = getFileUrl(userFile);

  if (!teacher) return null;

  const getFieldLabel = (key: string) => {
    const labelMap: Record<string, string> = {
      publicUserId: "Employee ID",
      class: "Assigned Class",
      division: "Division",
      subjects: "Subjects Taught",
      salary: "Salary Status",
      contact: "Phone",
      joiningDate: "Join Date",
      department: "Department",
      experience: "Experience",
      transport: "Transport",
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      gender: "Gender",
      dateOfBirth: "Date of Birth",
      designation: "Designation",
      highestQualification: "Highest Qualification",
      university: "University",
      yearOfPassing: "Year of Passing",
      grade: "Percentage/Grade",
      aadhaarId: "Aadhaar ID",
      panCardNumber: "PAN Card Number",
    };

    if (labelMap[key]) return labelMap[key];

    if (key.includes(".")) {
      const parts = key.split(".");
      const lastPart = parts[parts.length - 1];
      return lastPart
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
    }

    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const flattenObject = (obj: any, prefix = ""): Record<string, any> => {
    let flattened: Record<string, any> = {};

    const OMIT_FIELDS = [
      "id",
      "Id",
      "roleId",
      "Role Id",
      "schoolId",
      "School Id",
      "registrationPhotoId",
      "Registration Photo Id",
      "classId",
      "Class Id",
      "photoId",
      "Photo Id",
      "avatarId",
      "Avatar Id",
      "fileId",
      "File Id",
      "transportId",
      "Transport Id",
    ];

    Object.entries(obj).forEach(([key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (key.startsWith("_") || typeof value === "function") {
        return;
      }

      if (value === null || value === undefined || value === "") {
        return;
      }

      if (OMIT_FIELDS.includes(key)) {
        return;
      }

      if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === "object") {
          value.forEach((item, index) => {
            Object.assign(flattened, flattenObject(item, `${newKey}[${index}]`));
          });
        } else if (value.length > 0) {
          flattened[newKey] = value.join(", ");
        }
      } else if (typeof value === "object") {
        Object.assign(flattened, flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    });

    return flattened;
  };

  const formatValue = (key: string, value: any): string => {
    if (value === null || value === undefined || value === "") {
      return "N/A";
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (key.toLowerCase().includes("date") || key.toLowerCase().includes("dob")) {
      if (typeof value === "string") {
        try {
          const date = new Date(value);
          return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        } catch {
          return value;
        }
      }
    }

    if (key.toLowerCase().includes("address") && Array.isArray(value)) {
      return value.join(", ");
    }

    if (key.toLowerCase().includes("attendance") && typeof value === "object") {
      return value.percentage || "N/A";
    }

    return String(value);
  };

  const flattenedData = flattenObject(teacher);

  const displayFields = Object.entries(flattenedData)
    .filter(([key]) => {
      const lowerKey = key.toLowerCase();
      return !lowerKey.includes("created") && !lowerKey.includes("updated");
    })
    .sort(([a], [b]) => {
      const order = [
        "firstName",
        "lastName",
        "publicUserId",
        "email",
        "contact",
        "gender",
        "dateOfBirth",
        "designation",
        "subjects",
        "class",
        "division",
        "highestQualification",
        "university",
        "yearOfPassing",
        "grade",
        "aadhaarId",
        "panCardNumber",
        "salary",
        "attendance",
        "transport",
      ];

      const aIndex = order.findIndex((o) => a.toLowerCase().includes(o.toLowerCase()));
      const bIndex = order.findIndex((o) => b.toLowerCase().includes(o.toLowerCase()));

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Teacher Details</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-100px)] pr-4">
          <div className="space-y-6">
            {/* Photo Section */}
            <div className="flex justify-center">
              {loadingUserFile ? (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
              ) : userImageUrl ? (
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
                  <Image
                    src={userImageUrl}
                    alt={`${teacher.firstName || ""} ${teacher.lastName || ""}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <Avatar className="w-32 h-32">
                  <AvatarFallback className="text-2xl">
                    {teacher.firstName?.[0] || ""}
                    {teacher.lastName?.[0] || ""}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayFields.map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    {getFieldLabel(key)}
                  </p>
                  <p className="text-sm text-gray-900 break-words">
                    {formatValue(key, value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

