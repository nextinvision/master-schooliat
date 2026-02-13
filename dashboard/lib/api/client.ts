import { getToken } from "@/lib/auth/storage";
import { apiEvents, API_EVENTS } from "./events";

// API Base URL - must be set in environment variables
// During build time, use a placeholder if not set (will be replaced at runtime)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.schooliat.com";

/**
 * Custom error class for API errors with status code
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data: any = null
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Handle HTTP response status codes centrally
 * Emits events for 401, 403, 500 errors to be handled by ToastProvider
 */
function handleResponseStatus(res: Response): void {
  const status = res.status;

  switch (status) {
    case 401:
      // Unauthorized - emit event to trigger logout
      apiEvents.emit(API_EVENTS.UNAUTHORIZED, {
        message: "Your session has expired. Please log in again.",
      });
      break;

    case 403:
      // Forbidden - emit event to show access denied toast
      apiEvents.emit(API_EVENTS.FORBIDDEN, {
        message: "You are not authorized to perform this action.",
      });
      break;

    case 500:
    case 502:
    case 503:
    case 504:
      // Server errors - emit event to show server error toast
      apiEvents.emit(API_EVENTS.SERVER_ERROR, {
        message: "A server error occurred. Please try again later.",
        status,
      });
      break;

    default:
      // For other error statuses, we don't emit events
      // They can be handled by the calling code if needed
      break;
  }
}

interface RequestOptions {
  method?: string;
  query?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
}

async function request(
  path: string,
  { method = "GET", query, body, headers }: RequestOptions = {}
): Promise<any> {
  // Check for API URL at runtime (not during build)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || BASE_URL;
  if (!apiUrl || apiUrl === "https://api.schooliat.com") {
    // Only throw in browser/client context, not during SSR/build
    if (typeof window !== "undefined") {
      throw new Error(
        "NEXT_PUBLIC_API_URL environment variable is required. " +
        "Please set it in your .env file (e.g., NEXT_PUBLIC_API_URL=https://api.schooliat.com)"
      );
    }
  }

  // Ensure path starts with / and BASE_URL doesn't end with /
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const cleanBaseUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
  const url = new URL(cleanBaseUrl + cleanPath);

  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        url.searchParams.append(k, String(v));
      }
    });
  }

  const token = await getToken();

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method,
      headers: {
        ...headers,
        "Content-Type": "application/json",
        "x-platform": "web",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    // Network error (e.g., no internet connection)
    apiEvents.emit(API_EVENTS.NETWORK_ERROR, {
      message: "Network error. Please check your connection and try again.",
    });
    throw new ApiError("Network error. Please check your connection.", 0, null);
  }

  if (!res.ok) {
    // Handle specific status codes centrally
    handleResponseStatus(res);

    // Parse error response for additional context
    let errorData = null;
    let errorText = "";
    try {
      errorText = await res.text();
      try {
        errorData = JSON.parse(errorText);
      } catch {
        // Response was not JSON
      }
    } catch {
      // Could not read response body
    }

    // Create appropriate error message based on status
    let errorMessage: string;
    switch (res.status) {
      case 400:
        errorMessage =
          errorData?.message || "Invalid request. Please check your input.";
        break;
      case 401:
        errorMessage = "Session expired. Please log in again.";
        break;
      case 403:
        errorMessage = "You are not authorized to perform this action.";
        break;
      case 404:
        errorMessage = errorData?.message || "Resource not found.";
        break;
      case 422:
        errorMessage =
          errorData?.message || "Validation error. Please check your input.";
        break;
      case 429:
        errorMessage = "Too many requests. Please try again later.";
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorMessage = "A server error occurred. Please try again later.";
        break;
      default:
        errorMessage = errorData?.message || `Request failed (${res.status})`;
    }

    throw new ApiError(errorMessage, res.status, errorData);
  }

  // Handle empty responses (204 No Content)
  if (res.status === 204) {
    return null;
  }

  // Handle non-JSON responses
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }

  // Return text for non-JSON responses
  return res.text();
}

export function get(path: string, query?: Record<string, any>): Promise<any> {
  return request(path, { method: "GET", query });
}

export function post(path: string, body?: any): Promise<any> {
  return request(path, { method: "POST", body });
}

export function put(path: string, body?: any): Promise<any> {
  return request(path, { method: "PUT", body });
}

export function del(path: string): Promise<any> {
  return request(path, { method: "DELETE" });
}

export function patch(path: string, body?: any): Promise<any> {
  return request(path, { method: "PATCH", body });
}

// File upload utils
export async function uploadFile(file: File | Blob): Promise<any> {
  const token = await getToken();
  const formData = new FormData();
  formData.append("file", file);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || BASE_URL;
  // Ensure BASE_URL doesn't end with / and path starts with /
  const cleanBaseUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
  const res = await fetch(`${cleanBaseUrl}/files`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`File upload failed (${res.status}): ${text}`);
  }

  return res.json();
}

export async function getFile(fileId: string): Promise<{ url: string; blob: Blob }> {
  const token = await getToken();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || BASE_URL;
  // Ensure BASE_URL doesn't end with / and path starts with /
  const cleanBaseUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
  const res = await fetch(`${cleanBaseUrl}/files/${fileId}`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`File fetch failed (${res.status}): ${text}`);
  }

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);

  return { url: blobUrl, blob };
}

export function resetUserPassword(userId: string, newPassword: string): Promise<any> {
  const payload = {
    request: {
      userId,
      newPassword,
    },
  };
  return post("/users/reset-password", payload);
}

export function changeUserPassword(
  currentPassword: string,
  newPassword: string
): Promise<any> {
  const payload = {
    request: {
      currentPassword,
      newPassword,
    },
  };
  return post("/users/change-password", payload);
}

