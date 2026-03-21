import { BASE_URL } from "@/lib/api/config";

/**
 * Turn API-relative file URLs into a URL the browser can open.
 * Backend often returns `/files/:id` or `https://api/.../files/:id`; when the app is on another origin,
 * relative `/files/...` must be prefixed with NEXT_PUBLIC_API_URL.
 */
export function resolvePublicFileUrl(url: string | null | undefined): string {
  if (url == null || url === "") return "";
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = BASE_URL.replace(/\/$/, "");
  if (trimmed.startsWith("/")) return `${base}${trimmed}`;
  return `${base}/${trimmed}`;
}
