"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2, Plus } from "lucide-react";
import { searchInventoryByName } from "@/lib/utils/search-utils";

const CATEGORY_OPTIONS = ["All Categories", "Electronics", "Stationery", "Furniture", "Lab Equipment", "Sports"];
const UNIT_OPTIONS = ["All Units", "Pieces", "Boxes", "Kits", "Sets", "Bottles"];
const CONDITION_OPTIONS = ["All Conditions", "New", "Good", "Fair", "Poor"];

// Mock data - replace with API call
const MOCK_DATA = Array.from({ length: 50 }, (_, i) => ({
  id: `item-${i + 1}`,
  no: i + 1,
  itemName: `Item ${i + 1}`,
  itemCode: `INV${String(i + 1).padStart(3, "0")}`,
  avatar: `https://i.pravatar.cc/150?u=${i + 1}`,
  unit: ["Pieces", "Boxes", "Kits", "Sets", "Bottles"][i % 5],
  totalStock: Math.floor(Math.random() * 100) + 50,
  issuedTo: ["Class 12-A", "Lab Assistant", "Sports Dept", "Office", "Library"][i % 5],
  issuedQty: Math.floor(Math.random() * 20) + 5,
  lastIssuedDate: "2025-11-15",
  updatedStock: Math.floor(Math.random() * 80) + 20,
  condition: ["New", "Good", "Fair", "Poor"][i % 4],
  category: ["Electronics", "Stationery", "Furniture", "Lab Equipment", "Sports"][i % 5],
  type: ["Consumable", "Non Consumable"][i % 2],
}));

export function InventoryManagement() {
  const [page, setPage] = useState(0);
  const itemsPerPage = 15;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("Non Consumable");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [unitFilter, setUnitFilter] = useState("All Units");
  const [conditionFilter, setConditionFilter] = useState("All Conditions");

  const filteredData = useMemo(() => {
    let data = MOCK_DATA.filter((item) => item.type === activeTab);

    if (searchQuery.trim()) {
      data = searchInventoryByName(data, searchQuery);
    }

    if (categoryFilter !== "All Categories") {
      data = data.filter((item) => item.category === categoryFilter);
    }

    if (unitFilter !== "All Units") {
      data = data.filter((item) => item.unit === unitFilter);
    }

    if (conditionFilter !== "All Conditions") {
      data = data.filter((item) => item.condition === conditionFilter);
    }

    return data;
  }, [MOCK_DATA, searchQuery, activeTab, categoryFilter, unitFilter, conditionFilter]);

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, filteredData.length);
  const numberOfPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(from, to);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, activeTab, categoryFilter, unitFilter, conditionFilter]);

  const toggleRowSelection = (itemId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedRows(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map((item) => item.id)));
    }
  };

  const allSelected = paginatedData.length > 0 && selectedRows.size === paginatedData.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">Inventory Management</h1>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add New
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("Non Consumable")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "Non Consumable"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Non Consumable
        </button>
        <button
          onClick={() => setActiveTab("Consumable")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "Consumable"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Consumable
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by Item Name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={unitFilter} onValueChange={setUnitFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNIT_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={conditionFilter} onValueChange={setConditionFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONDITION_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedRows.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">
            {selectedRows.size} item(s) selected
          </span>
          <Button variant="destructive" size="sm">
            Delete Selected
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#e5ffc7]">
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-16">No</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead className="w-32">Unit</TableHead>
                <TableHead className="w-32">Total Stock</TableHead>
                <TableHead>Issued To</TableHead>
                <TableHead className="w-32">Issued Qty</TableHead>
                <TableHead className="w-40">Last Issued</TableHead>
                <TableHead className="w-32">Updated Stock</TableHead>
                <TableHead className="w-32">Condition</TableHead>
                <TableHead className="w-32">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    No inventory items found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => {
                  const isSelected = selectedRows.has(item.id);
                  return (
                    <TableRow
                      key={item.id}
                      className={isSelected ? "bg-blue-50" : "hover:bg-gray-50"}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRowSelection(item.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {String(item.no).padStart(2, "0")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={item.avatar} />
                            <AvatarFallback>{item.itemName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{item.itemName}</div>
                            <div className="text-xs text-gray-500">{item.itemCode}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className="text-right">{item.totalStock}</TableCell>
                      <TableCell>{item.issuedTo}</TableCell>
                      <TableCell className="text-right">{item.issuedQty}</TableCell>
                      <TableCell>{item.lastIssuedDate}</TableCell>
                      <TableCell className="text-right">{item.updatedStock}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            item.condition === "New"
                              ? "bg-green-100 text-green-800 border-green-300"
                              : item.condition === "Good"
                              ? "bg-blue-100 text-blue-800 border-blue-300"
                              : item.condition === "Fair"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                              : "bg-red-100 text-red-800 border-red-300"
                          }
                        >
                          {item.condition}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {numberOfPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page + 1} of {numberOfPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(numberOfPages - 1, page + 1))}
              disabled={page >= numberOfPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

