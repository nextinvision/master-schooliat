/**
 * Simple CSV parser utility
 * Converts CSV string to array of objects
 * Handles basic comma-separated values
 */

const parseCSV = (csvString) => {
    if (!csvString || typeof csvString !== "string") return [];

    const lines = csvString.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(header => header.trim());
    const results = [];

    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split(",").map(cell => cell.trim());
        const obj = {};

        headers.forEach((header, index) => {
            // Basic normalization of keys (lowercase, no spaces)
            const key = header.toLowerCase().replace(/\s+/g, '');
            obj[key] = currentLine[index] || "";
        });

        results.push(obj);
    }

    return results;
};

const generateCSV = (data, headers) => {
    if (!data || !Array.isArray(data) || data.length === 0) return "";

    const headerRow = headers.map(h => h.label).join(",");
    const rows = data.map(item => {
        return headers.map(h => {
            const value = h.key.split('.').reduce((obj, key) => obj?.[key], item) || "";
            // Escape double quotes and wrap in double quotes if it contains comma or newline
            const escaped = String(value).replace(/"/g, '""');
            return /[\n,"]/.test(escaped) ? `"${escaped}"` : escaped;
        }).join(",");
    });

    return [headerRow, ...rows].join("\n");
};

const csvUtil = {
    parseCSV,
    generateCSV,
};

export default csvUtil;
