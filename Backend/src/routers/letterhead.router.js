import { Router } from "express";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import withPermission from "../middlewares/with-permission.middleware.js";
import { Permission } from "../prisma/generated/index.js";

const router = Router();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load letterhead template
const getLetterheadTemplate = () => {
  const templatePath = join(__dirname, "../templates/letterhead.html");
  return readFileSync(templatePath, "utf-8");
};

router.get(
  "/",
  withPermission(Permission.CREATE_RECEIPT),
  async (req, res) => {
    try {
      const template = getLetterheadTemplate();
      return res.json({
        message: "Letterhead template fetched!",
        data: {
          template,
          endpoint: "/letterhead/generate",
          description: "POST to /letterhead/generate to generate a letterhead with content",
        },
      });
    } catch (error) {
      return res.status(500).json({
        error: "Failed to load letterhead template",
        message: error.message,
      });
    }
  },
);

router.post(
  "/generate",
  withPermission(Permission.CREATE_RECEIPT), // Using existing permission for now
  async (req, res) => {
    const request = req.body.request;

    if (!request.content || !request.content.trim()) {
      return res.status(400).json({
        error: "Content is required",
      });
    }

    // Escape HTML to prevent XSS
    const escapeHtml = (text) => {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };
      return text.replace(/[&<>"']/g, (m) => map[m]);
    };

    // Process formatting markers and convert to HTML
    const processFormatting = (text) => {
      // First escape HTML
      let processed = escapeHtml(text);

      // Convert formatting markers to HTML
      // Use a placeholder approach to avoid conflicts
      // Step 1: Replace bold markers with placeholder
      processed = processed.replace(
        /\*\*([^*]+?)\*\*/g,
        "~~BOLD_START~~$1~~BOLD_END~~",
      );
      // Step 2: Replace underline markers
      processed = processed.replace(
        /__([^_]+?)__/g,
        "~~UNDERLINE_START~~$1~~UNDERLINE_END~~",
      );
      // Step 3: Replace italic markers (single asterisks)
      processed = processed.replace(
        /\*([^*\n]+?)\*/g,
        "~~ITALIC_START~~$1~~ITALIC_END~~",
      );

      // Step 4: Convert placeholders to HTML
      processed = processed.replace(/~~BOLD_START~~/g, "<strong>");
      processed = processed.replace(/~~BOLD_END~~/g, "</strong>");
      processed = processed.replace(/~~UNDERLINE_START~~/g, "<u>");
      processed = processed.replace(/~~UNDERLINE_END~~/g, "</u>");
      processed = processed.replace(/~~ITALIC_START~~/g, "<em>");
      processed = processed.replace(/~~ITALIC_END~~/g, "</em>");

      // Convert newlines to <br>
      processed = processed.replace(/\n/g, "<br>");

      return processed;
    };

    const formattedContent = processFormatting(request.content);
    const escapedSubject = request.subject ? escapeHtml(request.subject) : null;
    const escapedSignatureName = request.signatureName
      ? escapeHtml(request.signatureName)
      : null;
    const escapedSignatureDesignation = request.signatureDesignation
      ? escapeHtml(request.signatureDesignation)
      : null;

    // Use provided date or default to current date
    let dateToUse;
    if (request.date) {
      // Handle YYYY-MM-DD format (from frontend) or ISO string
      if (
        typeof request.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(request.date)
      ) {
        // Parse YYYY-MM-DD as local date to avoid timezone issues
        const [year, month, day] = request.date.split("-").map(Number);
        dateToUse = new Date(year, month - 1, day);
      } else {
        dateToUse = new Date(request.date);
      }
      // Validate date
      if (isNaN(dateToUse.getTime())) {
        return res.status(400).json({
          error: "Invalid date format",
        });
      }
    } else {
      dateToUse = new Date();
    }

    const formattedDate = dateToUse.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Load template and replace placeholders
    let letterheadHTML = getLetterheadTemplate();

    // Replace template variables
    letterheadHTML = letterheadHTML.replace("{{DATE}}", formattedDate);

    // Replace subject section
    const subjectSection = escapedSubject
      ? `<div class="subject-section"><strong>Subject:</strong> ${escapedSubject}</div>`
      : "";
    letterheadHTML = letterheadHTML.replace(
      "{{SUBJECT_SECTION}}",
      subjectSection,
    );

    // Replace content
    letterheadHTML = letterheadHTML.replace("{{CONTENT}}", formattedContent);

    // Replace signature section
    const signatureSection =
      escapedSignatureName || escapedSignatureDesignation
        ? `
    <div class="signature-section">
        <div class="signature-line"></div>
        ${escapedSignatureName ? `<div class="signature-name">${escapedSignatureName}</div>` : ""}
        ${escapedSignatureDesignation ? `<div class="signature-designation">${escapedSignatureDesignation}</div>` : ""}
    </div>
    `
        : "";
    letterheadHTML = letterheadHTML.replace(
      "{{SIGNATURE_SECTION}}",
      signatureSection,
    );

    // Trim the result
    letterheadHTML = letterheadHTML.trim();

    // Return the HTML as a data URL or base64 encoded
    // For simplicity, we'll return it as a response that the frontend can handle
    const base64HTML = Buffer.from(letterheadHTML).toString("base64");
    const dataUrl = `data:text/html;base64,${base64HTML}`;

    return res.json({
      message: "Letterhead generated successfully!",
      data: {
        html: letterheadHTML,
        printUrl: dataUrl,
      },
    });
  },
);

export default router;
