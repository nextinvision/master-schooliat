"use client";

import { useState, useEffect } from "react";
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
import { useRequestDeletionOTP, useVerifyOTPAndDelete } from "@/lib/hooks/use-deletion-otp";
import { toast } from "sonner";
import { Loader2, ShieldAlert } from "lucide-react";

interface DeletionOTPModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  entityId: string;
  entityName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DeletionOTPModal({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityName,
  onSuccess,
  onCancel,
}: DeletionOTPModalProps) {
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const requestOTP = useRequestDeletionOTP();
  const verifyAndDelete = useVerifyOTPAndDelete();

  useEffect(() => {
    if (open && step === "request") {
      // Auto-request OTP when modal opens
      handleRequestOTP();
    }
  }, [open]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleRequestOTP = async () => {
    try {
      await requestOTP.mutateAsync({
        entityType,
        entityId,
      });
      setOtpSent(true);
      setStep("verify");
      setCountdown(600); // 10 minutes
      toast.success("OTP sent to your email. Please check your inbox.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to send OTP");
    }
  };

  const handleVerifyAndDelete = async () => {
    if (!otp.trim()) {
      toast.error("Please enter the OTP");
      return;
    }

    try {
      await verifyAndDelete.mutateAsync({
        entityType,
        entityId,
        otp: otp.trim(),
      });
      toast.success("Deleted successfully");
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast.error(error?.message || "Invalid OTP or deletion failed");
    }
  };

  const handleClose = () => {
    setOtp("");
    setStep("request");
    setOtpSent(false);
    setCountdown(0);
    onOpenChange(false);
  };

  const handleCancel = () => {
    handleClose();
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <DialogTitle>Confirm Deletion</DialogTitle>
          </div>
          <DialogDescription>
            You are about to delete <strong>{entityName}</strong>. This action requires email OTP verification.
          </DialogDescription>
        </DialogHeader>

        {step === "request" && (
          <div className="py-4">
            <div className="flex items-center justify-center py-8">
              {requestOTP.isPending ? (
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              ) : (
                <p className="text-sm text-gray-600">
                  Requesting OTP...
                </p>
              )}
            </div>
          </div>
        )}

        {step === "verify" && (
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
              {otpSent && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    OTP sent to your registered email
                  </span>
                  {countdown > 0 ? (
                    <span className="text-gray-500">
                      Expires in: {formatTime(countdown)}
                    </span>
                  ) : (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={handleRequestOTP}
                      disabled={requestOTP.isPending}
                      className="h-auto p-0"
                    >
                      Resend OTP
                    </Button>
                  )}
                </div>
              )}
            </div>

            {countdown === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  OTP has expired. Please request a new one.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={verifyAndDelete.isPending}>
            Cancel
          </Button>
          {step === "verify" && (
            <Button
              variant="destructive"
              onClick={handleVerifyAndDelete}
              disabled={verifyAndDelete.isPending || !otp.trim() || countdown === 0}
            >
              {verifyAndDelete.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

