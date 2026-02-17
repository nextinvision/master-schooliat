"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Eye, Download } from "lucide-react";
import {
  useTemplates,
  useTemplateDefaults,
  type Template,
} from "@/lib/hooks/use-super-admin";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

export default function TemplatesPage() {
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data, isLoading } = useTemplates(filterType === "all" ? undefined : filterType);
  const { data: defaultsData } = useTemplateDefaults(
    selectedTemplate?.id || ""
  );

  const templates = (data?.data || []) as Template[];
  const filteredTemplates = templates.filter((template: Template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const templateTypes = Array.from(new Set(templates.map((t: Template) => t.type)));

  const openPreview = (template: Template) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Template Management</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage document templates for receipts, certificates, and other documents
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle>All Templates</CardTitle>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {templateTypes.map((type: string) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery || filterType !== "all"
                ? "No templates found matching your filters"
                : "No templates found"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template: Template) => (
                <Card key={template.id} className="overflow-hidden">
                  <div className="relative h-48 bg-gray-100">
                    {template.imageUrl ? (
                      <Image
                        src={template.imageUrl}
                        alt={template.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <FileText className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm">{template.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {template.type}
                      </Badge>
                    </div>
                    {template.description && (
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openPreview(template)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      {template.sampleUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(template.sampleUrl, "_blank")}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Template Type: {selectedTemplate?.type}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTemplate?.imageUrl && (
              <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={selectedTemplate.imageUrl}
                  alt={selectedTemplate.name}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            {selectedTemplate?.description && (
              <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
            )}
            {defaultsData?.data && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Default Configuration</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                  {JSON.stringify(defaultsData.data, null, 2)}
                </pre>
              </div>
            )}
            {selectedTemplate?.sampleUrl && (
              <Button
                className="w-full"
                onClick={() => window.open(selectedTemplate.sampleUrl, "_blank")}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Sample PDF
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

