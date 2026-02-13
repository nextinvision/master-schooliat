/**
 * Export utilities for PDF, Excel, and CSV
 */

// Export to CSV
export function exportToCSV(data: any[], filename: string, headers?: string[]) {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    csvHeaders.join(","),
    ...data.map((row) =>
      csvHeaders
        .map((header) => {
          const value = row[header];
          // Handle values with commas or quotes
          if (value === null || value === undefined) return "";
          const stringValue = String(value);
          if (stringValue.includes(",") || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(",")
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export to Excel (using CSV format as Excel can open CSV)
export function exportToExcel(data: any[], filename: string, headers?: string[]) {
  // Excel can open CSV files, so we'll use CSV format
  exportToCSV(data, filename, headers);
}

// Type definition for jsPDF to avoid build-time dependency
type JSPDF = {
  new (): {
    setFontSize(size: number): void;
    text(text: string, x: number, y: number): void;
    addPage(): void;
    save(filename: string): void;
    setFont(font?: string, style?: string): void;
    internal: {
      pageSize: {
        getWidth(): number;
        getHeight(): number;
      };
    };
  };
};

// Export table to PDF (requires jsPDF library)
// Uses a type-safe dynamic import that handles missing module gracefully
export async function exportToPDF(
  data: any[],
  filename: string,
  headers?: string[],
  title?: string
) {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  try {
    // Dynamic import - will work if jspdf is installed, gracefully fails if not
    const jsPDFModule = await import("jspdf");
    
    // Handle both default export and named export patterns
    const JSPDFClass = (jsPDFModule.default || jsPDFModule) as JSPDF;
    const doc = new JSPDFClass();

    // Add title if provided
    if (title) {
      doc.setFontSize(16);
      doc.text(title, 14, 15);
      doc.setFontSize(10);
    }

    // Get headers
    const pdfHeaders = headers || Object.keys(data[0]);

    // Calculate column widths
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const availableWidth = pageWidth - 2 * margin;
    const colWidth = availableWidth / pdfHeaders.length;

    // Add headers
    let yPos = title ? 25 : 15;
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    pdfHeaders.forEach((header, index) => {
      doc.text(header, margin + index * colWidth, yPos);
    });

    // Add data rows
    yPos += 7;
    doc.setFont(undefined, "normal");
    data.forEach((row, rowIndex) => {
      // Check if we need a new page
      if (yPos > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPos = 15;
      }

      pdfHeaders.forEach((header, colIndex) => {
        const value = row[header] ?? "";
        const text = String(value).substring(0, 20); // Truncate long text
        doc.text(text, margin + colIndex * colWidth, yPos);
      });
      yPos += 7;
    });

    // Save PDF
    doc.save(`${filename}.pdf`);
  } catch (error: any) {
    console.error("Failed to export PDF:", error);
    // Fallback to CSV export if PDF fails
    const message = error?.message || "PDF export failed";
    if (message.includes("jsPDF") || message.includes("not found")) {
      alert("PDF export requires jsPDF library. Install it with: npm install jspdf\n\nFalling back to CSV export.");
      exportToCSV(data, filename, headers);
    } else {
      alert(`PDF export failed: ${message}\n\nFalling back to CSV export.`);
      exportToCSV(data, filename, headers);
    }
  }
}

// Format data for export
export function formatDataForExport(
  data: any[],
  columnMapping?: Record<string, string>
): { data: any[]; headers: string[] } {
  if (!data || data.length === 0) {
    return { data: [], headers: [] };
  }

  const headers = columnMapping
    ? Object.keys(columnMapping)
    : Object.keys(data[0]);

  const formattedData = data.map((row) => {
    const formattedRow: any = {};
    headers.forEach((header) => {
      const originalKey = columnMapping ? columnMapping[header] : header;
      formattedRow[header] = row[originalKey] ?? "";
    });
    return formattedRow;
  });

  return { data: formattedData, headers };
}

