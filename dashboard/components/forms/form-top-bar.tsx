"use client";

import { Button } from "@/components/ui/button";
import { X, RotateCcw, Save } from "lucide-react";

interface FormTopBarProps {
  title: string;
  onCancel?: () => void;
  onReset?: () => void;
  onSave?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  resetLabel?: string;
  isSaving?: boolean;
  extraActions?: React.ReactNode;
}

export function FormTopBar({
  title,
  onCancel,
  onReset,
  onSave,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  resetLabel = "Reset",
  isSaving = false,
  extraActions,
}: FormTopBarProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="flex items-center gap-3">
        {extraActions}
        {onCancel && (
          <Button variant="outline" onClick={onCancel} size="sm">
            <X className="h-4 w-4 mr-2" />
            {cancelLabel}
          </Button>
        )}
        {onReset && (
          <Button variant="outline" onClick={onReset} size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            {resetLabel}
          </Button>
        )}
        {onSave && (
          <Button
            onClick={onSave}
            disabled={isSaving}
            size="sm"
            className="bg-[#4CAF50] hover:bg-[#45a049]"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : saveLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

