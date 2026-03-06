"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Truck, Plus, Search, Loader2, Package, MapPin, Calendar } from "lucide-react";
import { toast } from "sonner";

interface CourierEntry {
    id: string;
    trackingNumber: string;
    provider: string;
    recipient: string;
    destination: string;
    contents: string;
    status: "Dispatched" | "In Transit" | "Delivered" | "Returned";
    dispatchDate: string;
    deliveryDate?: string;
}

const STATUS_COLORS: Record<string, string> = {
    "Dispatched": "bg-blue-100 text-blue-800 border-blue-300",
    "In Transit": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "Delivered": "bg-green-100 text-green-800 border-green-300",
    "Returned": "bg-red-100 text-red-800 border-red-300",
};

const PROVIDERS = ["India Post", "Blue Dart", "DTDC", "FedEx", "Professional Courier", "Speed Post", "Other"];

const EMPTY_FORM: {
    trackingNumber: string;
    provider: string;
    recipient: string;
    destination: string;
    contents: string;
    status: CourierEntry["status"];
} = {
    trackingNumber: "",
    provider: "India Post",
    recipient: "",
    destination: "",
    contents: "",
    status: "Dispatched",
};

// LocalStorage-based courier management (no backend dependency)
function getCouriers(): CourierEntry[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem("schooliat_couriers") || "[]");
    } catch {
        return [];
    }
}

function saveCouriers(couriers: CourierEntry[]) {
    localStorage.setItem("schooliat_couriers", JSON.stringify(couriers));
}

export function CourierManagement() {
    const [couriers, setCouriers] = useState<CourierEntry[]>(getCouriers);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editId, setEditId] = useState<string | null>(null);

    const filteredCouriers = couriers.filter((c) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q ||
            c.trackingNumber.toLowerCase().includes(q) ||
            c.recipient.toLowerCase().includes(q) ||
            c.destination.toLowerCase().includes(q);
        const matchesStatus = statusFilter === "All Status" || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const openCreate = () => {
        setEditId(null);
        setForm({ ...EMPTY_FORM });
        setIsDialogOpen(true);
    };

    const openEdit = (courier: CourierEntry) => {
        setEditId(courier.id);
        setForm({
            trackingNumber: courier.trackingNumber,
            provider: courier.provider,
            recipient: courier.recipient,
            destination: courier.destination,
            contents: courier.contents,
            status: courier.status,
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = () => {
        if (!form.trackingNumber || !form.recipient || !form.destination) {
            toast.error("Tracking number, recipient, and destination are required");
            return;
        }

        let updated: CourierEntry[];
        if (editId) {
            updated = couriers.map((c) =>
                c.id === editId
                    ? {
                        ...c,
                        ...form,
                        deliveryDate: form.status === "Delivered" ? new Date().toISOString() : c.deliveryDate,
                    }
                    : c
            );
            toast.success("Courier entry updated!");
        } else {
            const newEntry: CourierEntry = {
                id: Date.now().toString(),
                ...form,
                dispatchDate: new Date().toISOString(),
            };
            updated = [newEntry, ...couriers];
            toast.success("Courier entry added!");
        }

        setCouriers(updated);
        saveCouriers(updated);
        setIsDialogOpen(false);
    };

    const handleDelete = (id: string) => {
        if (!confirm("Delete this courier entry?")) return;
        const updated = couriers.filter((c) => c.id !== id);
        setCouriers(updated);
        saveCouriers(updated);
        toast.success("Courier entry deleted!");
    };

    const stats = {
        total: couriers.length,
        dispatched: couriers.filter((c) => c.status === "Dispatched").length,
        inTransit: couriers.filter((c) => c.status === "In Transit").length,
        delivered: couriers.filter((c) => c.status === "Delivered").length,
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold flex items-center gap-2">
                        <Truck className="w-6 h-6" />
                        Courier Management
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">Track dispatched couriers and mail</p>
                </div>
                <Button className="gap-2" onClick={openCreate}>
                    <Plus className="w-4 h-4" />
                    Add Courier Entry
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4 text-center">
                    <Package className="w-5 h-5 mx-auto mb-1 text-gray-500" />
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="border rounded-lg p-4 text-center">
                    <Truck className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                    <div className="text-2xl font-bold text-blue-600">{stats.dispatched}</div>
                    <div className="text-xs text-gray-500">Dispatched</div>
                </div>
                <div className="border rounded-lg p-4 text-center">
                    <MapPin className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                    <div className="text-2xl font-bold text-yellow-600">{stats.inTransit}</div>
                    <div className="text-xs text-gray-500">In Transit</div>
                </div>
                <div className="border rounded-lg p-4 text-center">
                    <Calendar className="w-5 h-5 mx-auto mb-1 text-green-500" />
                    <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
                    <div className="text-xs text-gray-500">Delivered</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search by tracking number, recipient, or destination..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All Status">All Status</SelectItem>
                        <SelectItem value="Dispatched">Dispatched</SelectItem>
                        <SelectItem value="In Transit">In Transit</SelectItem>
                        <SelectItem value="Delivered">Delivered</SelectItem>
                        <SelectItem value="Returned">Returned</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-schooliat-tint">
                            <TableHead className="w-16">No</TableHead>
                            <TableHead>Tracking #</TableHead>
                            <TableHead>Provider</TableHead>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Destination</TableHead>
                            <TableHead>Contents</TableHead>
                            <TableHead className="w-32">Status</TableHead>
                            <TableHead className="w-28">Date</TableHead>
                            <TableHead className="w-24">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCouriers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                    No courier entries found. Add your first courier entry above.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCouriers.map((courier, idx) => (
                                <TableRow key={courier.id} className="hover:bg-gray-50">
                                    <TableCell className="font-medium">{String(idx + 1).padStart(2, "0")}</TableCell>
                                    <TableCell className="font-mono text-sm">{courier.trackingNumber}</TableCell>
                                    <TableCell>{courier.provider}</TableCell>
                                    <TableCell>{courier.recipient}</TableCell>
                                    <TableCell>{courier.destination}</TableCell>
                                    <TableCell className="text-sm text-gray-600">{courier.contents || "—"}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={STATUS_COLORS[courier.status] || ""}>
                                            {courier.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {new Date(courier.dispatchDate).toLocaleDateString("en-IN")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(courier)}>
                                                Edit
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(courier.id)}>
                                                ✕
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editId ? "Edit Courier Entry" : "Add Courier Entry"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Tracking # *</Label>
                            <Input
                                className="col-span-3"
                                value={form.trackingNumber}
                                onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })}
                                placeholder="e.g. EE012345678IN"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Provider *</Label>
                            <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROVIDERS.map((p) => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Recipient *</Label>
                            <Input
                                className="col-span-3"
                                value={form.recipient}
                                onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                                placeholder="School or person name"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Destination *</Label>
                            <Input
                                className="col-span-3"
                                value={form.destination}
                                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                                placeholder="City, State"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Contents</Label>
                            <Input
                                className="col-span-3"
                                value={form.contents}
                                onChange={(e) => setForm({ ...form, contents: e.target.value })}
                                placeholder="e.g. ID Cards, Documents"
                            />
                        </div>
                        {editId && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Status</Label>
                                <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Dispatched">Dispatched</SelectItem>
                                        <SelectItem value="In Transit">In Transit</SelectItem>
                                        <SelectItem value="Delivered">Delivered</SelectItem>
                                        <SelectItem value="Returned">Returned</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>
                            {editId ? "Update" : "Add Entry"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
