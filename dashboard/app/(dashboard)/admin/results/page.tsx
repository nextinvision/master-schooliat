"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResultManagement } from "@/components/results/result-management";
import { MarksEntry } from "@/components/results/marks-entry";

export default function ResultsPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <Tabs defaultValue="results" className="space-y-6">
        <TabsList>
          <TabsTrigger value="results">Results Overview</TabsTrigger>
          <TabsTrigger value="marks">Enter Marks</TabsTrigger>
        </TabsList>

        <TabsContent value="results">
          <ResultManagement />
        </TabsContent>

        <TabsContent value="marks">
          <MarksEntry />
        </TabsContent>
      </Tabs>
    </div>
  );
}
