"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Plus, Edit, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Notice {
  id: string;
  title: string;
  content: string;
  visibleFrom: string;
  visibleTill: string;
  createdAt: string;
}

interface NoticeBoardWidgetProps {
  notices?: Notice[];
}

export function NoticeBoardWidget({ notices = [] }: NoticeBoardWidgetProps) {
  const router = useRouter();

  const handleAddNew = () => {
    router.push("/admin/circulars/add");
  };

  const handleViewAll = () => {
    router.push("/admin/circulars");
  };

  return (
    <Card className="card-hover-lift transition-all duration-300 hover:shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#678d3d]" />
            Notice Board
          </CardTitle>
          <Link
            href="/admin/circulars"
            className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors duration-200 hover:underline"
          >
            View all →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No notices available</p>
            </div>
          ) : (
            notices.slice(0, 2).map((notice, index) => (
              <div
                key={notice.id}
                className={cn(
                  "flex items-start gap-3 p-3 border rounded-lg",
                  "hover:bg-gray-50 hover:shadow-md hover:-translate-y-0.5",
                  "transition-all duration-300 cursor-pointer",
                  "animate-slide-up"
                )}
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  opacity: 0,
                  animationFillMode: "forwards"
                }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <Bell className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 mb-1">
                    {notice.title}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {notice.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(notice.createdAt), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 transition-all duration-300 hover:bg-[#678d3d] hover:text-white hover:shadow-md hover:-translate-y-0.5"
            onClick={handleAddNew}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="transition-all duration-300 hover:bg-[#678d3d] hover:text-white hover:shadow-md hover:scale-110"
            onClick={handleViewAll}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

