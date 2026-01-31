"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudentFees } from "@/lib/hooks/use-fees";
import { Skeleton } from "@/components/ui/skeleton";

function formatCurrency(num: number | string | null | undefined): string {
  return `₹${Number(num || 0).toLocaleString("en-IN")}`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

interface FeeDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  studentId: string | null;
}

export function FeeDetailsModal({ visible, onClose, studentId }: FeeDetailsModalProps) {
  const { data, isLoading } = useStudentFees(studentId || "", {
    enabled: !!studentId && visible,
  });

  const fees = data?.data || null;

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Fee Details</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : fees ? (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Student Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>{" "}
                    {[fees.student?.firstName, fees.student?.lastName]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </div>
                  <div>
                    <span className="text-gray-600">Class:</span>{" "}
                    {fees.student?.class?.grade || "—"}
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Installments</h3>
                <div className="space-y-2">
                  {fees.installments?.map((installment: any, index: number) => (
                    <div
                      key={installment.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">Installment {index + 1}</div>
                        <div className="text-sm text-gray-600">
                          Amount: {formatCurrency(installment.amount)} | Paid:{" "}
                          {formatCurrency(installment.paidAmount)} | Remaining:{" "}
                          {formatCurrency(installment.remainingAmount)}
                        </div>
                        {installment.paidAt && (
                          <div className="text-xs text-gray-500">
                            Paid at: {formatDate(installment.paidAt)}
                          </div>
                        )}
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          installment.paymentStatus === "PAID"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {installment.paymentStatus === "PAID" ? "Paid" : "Pending"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No fee details available
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

