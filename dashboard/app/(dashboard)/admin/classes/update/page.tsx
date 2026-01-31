"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FormTopBar } from "@/components/forms/form-top-bar";
import { FormCard } from "@/components/forms/form-card";
import { ClassFormTable } from "@/components/classes/class-form-table";
import { useClassesPage, useCreateClasses } from "@/lib/hooks/use-classes";
import { useTeachersPage } from "@/lib/hooks/use-teachers";
import { ClassItem, classesSchema } from "@/lib/schemas/class-schema";
import { toast } from "sonner";

export default function UpdateClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { mutateAsync: createClasses, isPending: isSaving } = useCreateClasses();

  // Fetch all classes
  const { data: classesData, isLoading: isLoadingClasses } = useClassesPage(1, 1000);
  const allClasses = classesData?.data ?? [];

  // Fetch teachers
  const { data: teachersData, isLoading: isLoadingTeachers } = useTeachersPage(1, 1000);
  const teachers = teachersData?.data ?? [];

  useEffect(() => {
    if (allClasses && allClasses.length > 0) {
      setClasses(
        allClasses.map((cls: any) => ({
          id: cls.id || null,
          grade: cls.grade || "",
          division: cls.division || "",
          classTeacherId: cls.classTeacherId || null,
        }))
      );
    } else {
      setClasses([{ id: null, grade: "", division: "", classTeacherId: null }]);
    }
  }, [allClasses]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    try {
      classesSchema.parse(classes);
    } catch (error: any) {
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const path = err.path[0];
          if (typeof path === "number") {
            const field = err.path[1];
            if (field) {
              newErrors[`${field}_${path}`] = err.message;
            }
          }
        });
      }
    }

    classes.forEach((cls, index) => {
      if (!cls.grade) {
        newErrors[`grade_${index}`] = "Grade is required";
      }
      if (!cls.division) {
        newErrors[`division_${index}`] = "Division is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (index: number, field: keyof ClassItem, value: any) => {
    const newClasses = [...classes];
    newClasses[index] = { ...newClasses[index], [field]: value };
    setClasses(newClasses);

    // Clear error for this field
    const newErrors = { ...errors };
    delete newErrors[`${field}_${index}`];
    setErrors(newErrors);
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fix errors in the form");
      return;
    }

    try {
      await createClasses(classes);
      toast.success("Classes updated successfully");
      setTimeout(() => {
        router.push("/admin/classes");
      }, 1500);
    } catch (error: any) {
      toast.error(error?.message || "Failed to update classes");
    }
  };

  if (isLoadingClasses || isLoadingTeachers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <FormTopBar
        title="Update Classes"
        onCancel={() => router.push("/admin/classes")}
        onReset={() => {
          if (allClasses && allClasses.length > 0) {
            setClasses(
              allClasses.map((cls: any) => ({
                id: cls.id || null,
                grade: cls.grade || "",
                division: cls.division || "",
                classTeacherId: cls.classTeacherId || null,
              }))
            );
          } else {
            setClasses([{ id: null, grade: "", division: "", classTeacherId: null }]);
          }
          setErrors({});
        }}
        onSave={handleSubmit}
        isSaving={isSaving}
      />

      <FormCard>
        <ClassFormTable
          classes={classes}
          teachers={teachers}
          errors={errors}
          onChange={setClasses}
          onFieldChange={handleFieldChange}
        />
      </FormCard>
    </div>
  );
}

