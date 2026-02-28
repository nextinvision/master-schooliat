"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUp, Download, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BulkUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onUpload: (csvData: string) => Promise<any>;
    templateHeaders: string[];
    templateFilename: string;
}

export function BulkUploadDialog({
    open,
    onOpenChange,
    title,
    description,
    onUpload,
    templateHeaders,
    templateFilename,
}: BulkUploadDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [results, setResults] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResults(null);
        }
    };

    const handleDownloadTemplate = () => {
        const csvContent = templateHeaders.join(",") + "\n";
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", templateFilename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setResults(null);

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result as string;
                try {
                    const response = await onUpload(text);
                    setResults(response.data);
                    toast.success("Bulk upload completed");
                } catch (error: any) {
                    toast.error(error?.message || "Upload failed");
                } finally {
                    setIsUploading(false);
                }
            };
            reader.readAsText(file);
        } catch (error: any) {
            toast.error("Failed to read file");
            setIsUploading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setResults(null);
        setIsUploading(false);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) reset();
        }}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-dashed text-sm">
                        <div className="space-y-1">
                            <p className="font-medium">Need a template?</p>
                            <p className="text-muted-foreground">Download our CSV template to ensure correct formatting.</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-2">
                            <Download className="h-4 w-4" />
                            Template
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="csv-file">Select CSV File</Label>
                        <div className="flex gap-2">
                            <Input
                                id="csv-file"
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                disabled={isUploading}
                                className="cursor-pointer"
                            />
                            <Button
                                onClick={handleUpload}
                                disabled={!file || isUploading}
                                className="gap-2 shrink-0"
                            >
                                {isUploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <FileUp className="h-4 w-4" />
                                )}
                                Upload
                            </Button>
                        </div>
                    </div>

                    {results && (
                        <div className="space-y-3 flex-1 overflow-hidden flex flex-col border rounded-lg p-4 bg-muted/20">
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 text-green-600 font-medium">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>{results.success} Succeeded</span>
                                </div>
                                <div className="flex items-center gap-2 text-red-600 font-medium">
                                    <XCircle className="h-4 w-4" />
                                    <span>{results.failed} Failed</span>
                                </div>
                            </div>

                            {results.errors.length > 0 && (
                                <div className="flex-1 overflow-hidden flex flex-col gap-2">
                                    <p className="text-sm font-medium">Errors Summary:</p>
                                    <ScrollArea className="flex-1 bg-white rounded border">
                                        <div className="p-3 space-y-2">
                                            {results.errors.map((err: any, idx: number) => (
                                                <div key={idx} className="text-xs p-2 bg-red-50 rounded border border-red-100 flex gap-2">
                                                    <span className="font-semibold">{err.row}:</span>
                                                    <span className="text-red-700">{err.error}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
                        {results ? "Close" : "Cancel"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
