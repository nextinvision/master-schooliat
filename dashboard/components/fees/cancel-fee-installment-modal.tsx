"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRequestOTP, useCancelFeeInstallment } from "@/lib/hooks/use-fees";
import { useToast } from "@/hooks/use-toast";

interface CancelFeeInstallmentModalProps {
  visible: boolean;
  onClose: () => void;
  installment: { id: string; installementNumber?: number } | null;
  onSuccess: () => void;
}

export function CancelFeeInstallmentModal({
  visible,
  onClose,
  installment,
  onSuccess,
}: CancelFeeInstallmentModalProps) {
  const { toast } = useToast();
  const requestOTP = useRequestOTP();
  const cancelMut = useCancelFeeInstallment();
  const [otp, setOtp] = useState("");
  const [reason, setReason] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);

  const handleClose = () => {
    setOtp("");
    setReason("");
    setOtpRequested(false);
    onClose();
  };

  const handleRequestOTP = async () => {
    try {
      const res = await requestOTP.mutateAsync();
      setOtpRequested(true);
      const email = res?.data?.email || res?.email || null;
      toast({
        title: "OTP Sent",
        description: email
          ? `Code sent to ${email}`
          : "Verification code sent to your registered email.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!installment?.id || otp.length !== 6) {
      toast({
        title: "Invalid",
        description: "Enter the 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }
    try {
      await cancelMut.mutateAsync({
        installmentId: installment.id,
        otp,
        reason: reason.trim() || undefined,
      });
      toast({ title: "Cancelled", description: "Installment has been cancelled." });
      handleClose();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Could not cancel",
        description: error?.message || "Request failed",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Cancel installment
            {installment?.installementNumber != null
              ? ` #${installment.installementNumber}`
              : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Cancelling reverses recorded payments on this row for totals and marks the installment as cancelled. OTP is required (same as recording payments).
          </p>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason (optional)</Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. Duplicate entry, transferred out"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cancel-otp">OTP</Label>
            <Input
              id="cancel-otp"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code"
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleRequestOTP} disabled={requestOTP.isPending}>
              {requestOTP.isPending ? "Sending…" : "Send OTP"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleSubmit}
              disabled={cancelMut.isPending || !otpRequested || otp.length !== 6}
            >
              {cancelMut.isPending ? "Cancelling…" : "Confirm cancel"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
