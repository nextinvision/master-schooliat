"use client";

import { GenerateReceiptForm } from "@/components/super-admin/receipts/generate-receipt-form";

export default function EditReceiptPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6 px-4">
      <GenerateReceiptForm receiptId={params.id} />
    </div>
  );
}

