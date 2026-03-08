import { Router } from "express";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import prisma from "../prisma/client.js";
import withPermission from "../middlewares/with-permission.middleware.js";
import {
    Permission,
    InvoiceStatus,
} from "../prisma/generated/index.js";
import paginateUtil from "../utils/paginate.util.js";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load invoice template
const getInvoiceTemplate = () => {
    const templatePath = join(__dirname, "../templates/schooliat-invoice.html");
    return readFileSync(templatePath, "utf-8");
};

// Escape HTML to prevent XSS
const escapeHtml = (text) => {
    if (!text) return "";
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
};

// Convert number to words (Indian format)
const numberToWords = (num) => {
    const ones = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
        "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
    ];
    const tens = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
    ];

    if (num === 0) return "Zero";

    const convertLessThanThousand = (n) => {
        if (n === 0) return "";
        if (n < 20) return ones[n];
        if (n < 100)
            return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
        return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "");
    };

    const intPart = Math.floor(num);
    const decPart = Math.round((num - intPart) * 100);

    let words = "";
    let n = intPart;

    if (n >= 10000000) {
        words += convertLessThanThousand(Math.floor(n / 10000000)) + " Crore ";
        n = n % 10000000;
    }

    if (n >= 100000) {
        words += convertLessThanThousand(Math.floor(n / 100000)) + " Lakh ";
        n = n % 100000;
    }

    if (n >= 1000) {
        words += convertLessThanThousand(Math.floor(n / 1000)) + " Thousand ";
        n = n % 1000;
    }

    if (n > 0) {
        words += convertLessThanThousand(n);
    }

    words = words.trim() + " Rupees";

    if (decPart > 0) {
        words += " and " + convertLessThanThousand(decPart) + " Paise";
    }

    return words + " Only";
};

const router = Router();

router.post(
    "/",
    withPermission(Permission.CREATE_INVOICE),
    async (req, res) => {
        const request = req.body.request;
        const currentUser = req.context.user;
        const {
            schoolId,
            vendorId,
            baseAmount,
            sgstPercent,
            cgstPercent,
            igstPercent,
            ugstPercent,
            description,
            dueDate,
        } = request;

        if (!schoolId && !vendorId) {
            return res.status(400).json({ message: "Either schoolId or vendorId is required" });
        }

        // Calculate GST amounts
        const base = baseAmount ? parseFloat(baseAmount) : 0;
        const sgst = sgstPercent ? parseFloat(sgstPercent) : 0;
        const cgst = cgstPercent ? parseFloat(cgstPercent) : 0;
        const igst = igstPercent ? parseFloat(igstPercent) : 0;
        const ugst = ugstPercent ? parseFloat(ugstPercent) : 0;

        const sgstAmount = sgst > 0 ? (base * sgst) / 100 : 0;
        const cgstAmount = cgst > 0 ? (base * cgst) / 100 : 0;
        const igstAmount = igst > 0 ? (base * igst) / 100 : 0;
        const ugstAmount = ugst > 0 ? (base * ugst) / 100 : 0;
        const totalGst = sgstAmount + cgstAmount + igstAmount + ugstAmount;
        const totalAmount = base + totalGst;

        const invoiceData = {
            schoolId: schoolId || null,
            vendorId: vendorId || null,
            baseAmount: base.toFixed(2),
            sgstPercent: sgst > 0 ? sgst.toFixed(2) : null,
            cgstPercent: cgst > 0 ? cgst.toFixed(2) : null,
            igstPercent: igst > 0 ? igst.toFixed(2) : null,
            ugstPercent: ugst > 0 ? ugst.toFixed(2) : null,
            sgstAmount: sgstAmount > 0 ? sgstAmount.toFixed(2) : null,
            cgstAmount: cgstAmount > 0 ? cgstAmount.toFixed(2) : null,
            igstAmount: igstAmount > 0 ? igstAmount.toFixed(2) : null,
            ugstAmount: ugstAmount > 0 ? ugstAmount.toFixed(2) : null,
            totalGst: totalGst > 0 ? totalGst.toFixed(2) : null,
            amount: totalAmount.toFixed(2),
            description,
            dueDate: dueDate ? new Date(dueDate) : null,
            status: InvoiceStatus.DRAFT,
            createdBy: currentUser.id,
        };

        const newInvoice = await prisma.invoice.create({
            data: invoiceData,
        });

        return res.status(201).json({
            message: "Invoice created!",
            data: newInvoice,
        });
    }
);

router.get("/", withPermission(Permission.GET_INVOICES), async (req, res) => {
    const { schoolId, vendorId, status } = req.query;

    const where = {
        deletedAt: null,
        ...(schoolId && { schoolId }),
        ...(vendorId && { vendorId }),
        ...(status && { status }),
    };

    const invoices = await prisma.invoice.findMany({
        where,
        include: {
            school: {
                select: { name: true, code: true }
            },
            vendor: {
                select: { name: true, email: true }
            }
        },
        orderBy: { createdAt: "desc" },
        ...paginateUtil.getPaginationParams(req),
    });

    return res.json({
        message: "Invoices fetched!",
        data: invoices,
    });
});

router.get("/:id", withPermission(Permission.GET_INVOICES), async (req, res) => {
    const invoice = await prisma.invoice.findUniqueOrThrow({
        where: { id: req.params.id },
        include: {
            school: true,
            vendor: true,
        },
    });

    return res.json({ data: invoice });
});

router.patch("/:id", withPermission(Permission.UPDATE_INVOICE), async (req, res) => {
    const request = req.body.request;
    const currentUser = req.context.user;

    const updatedInvoice = await prisma.invoice.update({
        where: { id: req.params.id },
        data: {
            ...request,
            updatedBy: currentUser.id,
        },
    });

    return res.json({
        message: "Invoice updated!",
        data: updatedInvoice,
    });
});

router.delete("/:id", withPermission(Permission.DELETE_INVOICE), async (req, res) => {
    const currentUser = req.context.user;

    await prisma.invoice.update({
        where: { id: req.params.id },
        data: {
            deletedAt: new Date(),
            deletedBy: currentUser.id,
        },
    });

    return res.json({ message: "Invoice deleted!" });
});

router.post("/:id/generate", withPermission(Permission.GET_INVOICES), async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body || {};

    const invoice = await prisma.invoice.findUniqueOrThrow({
        where: { id, deletedAt: null },
        include: {
            school: true,
            vendor: true,
        },
    });

    const template = getInvoiceTemplate();

    // Format Date
    const issueDate = new Date(invoice.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const dueDateStr = invoice.dueDate
        ? new Date(invoice.dueDate).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : "N/A";

    const recipient = invoice.school || invoice.vendor;
    const recipientName = recipient.name;
    let recipientAddress = "";
    if (invoice.school && recipient.address) {
        recipientAddress = recipient.address.join("<br>");
    } else if (invoice.vendor && recipient.address) {
        recipientAddress = recipient.address.join("<br>");
    }

    const recipientPhone = recipient.phone || recipient.contact || "N/A";
    const recipientEmail = recipient.email || "N/A";

    const billTo = `<strong>${escapeHtml(recipientName)}</strong><br>${recipientAddress}`;

    // GST Logic
    const sgstVal = parseFloat(invoice.sgstPercent) || 0;
    const cgstVal = parseFloat(invoice.cgstPercent) || 0;
    const igstVal = parseFloat(invoice.igstPercent) || 0;
    const ugstVal = parseFloat(invoice.ugstPercent) || 0;

    let tax1Name, tax2Name, tax1Percent, tax2Percent, tax1Amount, tax2Amount;

    if (cgstVal > 0 && sgstVal > 0) {
        tax1Name = "CGST"; tax2Name = "SGST";
        tax1Percent = invoice.cgstPercent; tax2Percent = invoice.sgstPercent;
        tax1Amount = invoice.cgstAmount; tax2Amount = invoice.sgstAmount;
    } else if (igstVal > 0) {
        tax1Name = "IGST"; tax2Name = "—";
        tax1Percent = invoice.igstPercent; tax2Percent = "0";
        tax1Amount = invoice.igstAmount; tax2Amount = "0";
    } else if (cgstVal > 0 && ugstVal > 0) {
        tax1Name = "CGST"; tax2Name = "UGST";
        tax1Percent = invoice.cgstPercent; tax2Percent = invoice.ugstPercent;
        tax1Amount = invoice.cgstAmount; tax2Amount = invoice.ugstAmount;
    } else {
        tax1Name = "CGST"; tax2Name = "SGST";
        tax1Percent = "0"; tax2Percent = "0";
        tax1Amount = "0"; tax2Amount = "0";
    }

    const formatAmount = (amt) => {
        const num = parseFloat(amt) || 0;
        return num.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const replacements = {
        "{{INVOICE_NO}}": escapeHtml(invoice.invoiceNumber) || "DRAFT",
        "{{ISSUE_DATE}}": issueDate,
        "{{DUE_DATE}}": dueDateStr,
        "{{BILL_TO}}": billTo,
        "{{SHIP_TO}}": recipientAddress,
        "{{RECIPIENT_PHONE}}": escapeHtml(recipientPhone),
        "{{RECIPIENT_EMAIL}}": escapeHtml(recipientEmail),
        "{{DESCRIPTION}}": escapeHtml(invoice.description) || "Schooliat Subscription Fee",
        "{{TAXABLE_VALUE}}": formatAmount(invoice.baseAmount),
        "{{PRICE}}": formatAmount(invoice.baseAmount),
        "{{TAX_1}}": tax1Name,
        "{{TAX_2}}": tax2Name,
        "{{TAX_1_PERCENTAGE}}": tax1Percent + "%",
        "{{TAX_2_PERCENTAGE}}": tax2Percent + "%",
        "{{TAX_1_AMOUNT}}": formatAmount(tax1Amount),
        "{{TAX_2_AMOUNT}}": formatAmount(tax2Amount),
        "{{AMOUNT}}": formatAmount(invoice.amount),
        "{{AMOUNT_IN_WORDS}}": numberToWords(parseFloat(invoice.amount)),
        "{{NOTES}}": escapeHtml(notes) || "Thank you for your business.",
        "{{COMPANY_ADDRESS}}": "Flat No. 301, Manikanta Residency, Nagaram, Hyderabad, Telangana - 500083",
        "{{GST_NUMBER}}": "36AAXCS1415E1ZM",
    };

    let invoiceHTML = template;
    Object.entries(replacements).forEach(([key, value]) => {
        invoiceHTML = invoiceHTML.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g"), value);
    });

    const base64HTML = Buffer.from(invoiceHTML.trim()).toString("base64");
    const dataUrl = `data:text/html;base64,${base64HTML}`;

    return res.json({
        message: "Invoice generated successfully!",
        data: {
            html: invoiceHTML.trim(),
            printUrl: dataUrl,
        },
    });
});

export default router;
