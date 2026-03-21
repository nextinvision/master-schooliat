"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestSuperAdminDeletionOtp } from "@/lib/hooks/use-deletion-otp";
import type { SuperAdminDeletionEntityType } from "@/lib/super-admin/deletion-entity-types";
import { ApiError } from "@/lib/api/client";

export type SuperAdminDeletionOtpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  entityType: SuperAdminDeletionEntityType;
  entityId: string;
  isDeleting: boolean;
  onDeleteWithOtp: (otp: string) => Promise<void>;
};

export function SuperAdminDeletionOtpDialog({
  open,
  onOpenChange,
  title,
  description,
  entityType,
  entityId,
  isDeleting,
  onDeleteWithOtp,
}: SuperAdminDeletionOtpDialogProps) {
  const [phase, setPhase] = useState<"send" | "confirm">("send");
  const [otp, setOtp] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPhase("send");
      setOtp("");
      setError(null);
      setRequesting(false);
    }
  }, [open]);

  const handleSendCode = async () => {
    if (!entityId) return;
    setError(null);
    setRequesting(true);
    try {
      await requestSuperAdminDeletionOtp(entityType, entityId);
      setPhase("confirm");
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Failed to send verification code";
      setError(msg);
    } finally {
      setRequesting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setError(null);
    try {
      await onDeleteWithOtp(otp.trim());
      onOpenChange(false);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Delete failed";
      setError(msg);
    }
  };

  const canSend = Boolean(entityId) && !requesting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {phase === "send" ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              For security, we will email a one-time code to your registered
              super-admin address. Use that code on the next step to confirm
              deletion.
            </p>
            {error ? (
              <p className="text-destructive text-sm font-medium">{error}</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to your email.
            </p>
            <div className="space-y-2">
              <Label htmlFor="deletion-otp">Verification code</Label>
              <Input
                id="deletion-otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="font-mono tracking-widest text-lg"
              />
            </div>
            {error ? (
              <p className="text-destructive text-sm font-medium">{error}</p>
            ) : null}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {phase === "send" ? (
            <Button
              type="button"
              onClick={handleSendCode}
              disabled={!canSend}
            >
              {requesting ? "Sending…" : "Send verification code"}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPhase("send");
                  setOtp("");
                  setError(null);
                }}
                disabled={isDeleting}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting || otp.length !== 6}
              >
                {isDeleting ? "Deleting…" : "Confirm delete"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
