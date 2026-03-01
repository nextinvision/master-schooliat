"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentSchema, PaymentFormData } from "@/lib/schemas/fees-schema";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatCurrency(num: number | string | null | undefined): string {
  return `₹${Number(num || 0).toLocaleString("en-IN")}`;
}

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: PaymentFormData) => Promise<void>;
  installment: any;
  isSubmitting: boolean;
}

export function PaymentModal({
  visible,
  onClose,
  onSubmit,
  installment,
  isSubmitting,
}: PaymentModalProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      isWaiver: false,
    },
  });

  const isWaiver = watch("isWaiver");

  const onFormSubmit = async (data: PaymentFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      // Error handling is done in parent
    }
  };

  const remainingAmount = installment?.remainingAmount || 0;

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b">
            <Controller
              name="isWaiver"
              control={control}
              render={({ field }) => (
                <Switch
                  id="isWaiver"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isWaiver">Waive this Installment</Label>
          </div>

          <div className={`space-y-4 ${isWaiver ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={errors.paymentMethod ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                      <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.paymentMethod && (
                <p className="text-sm text-red-500">{errors.paymentMethod.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register("amount", { valueAsNumber: true })}
                placeholder="Enter payment amount"
                max={remainingAmount}
                className={errors.amount ? "border-red-500" : ""}
                disabled={isWaiver}
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
              <p className="text-sm text-gray-600">
                Remaining amount: {formatCurrency(remainingAmount)}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

