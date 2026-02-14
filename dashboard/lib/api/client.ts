/**
 * Centralized API Client
 * Handles all HTTP requests to the backend API
 */

import { apiEvents, API_EVENTS } from "./events";
import { clearToken } from "@/lib/auth/storage";

// API Base URL - must be set in environment variables
// Next.js embeds NEXT_PUBLIC_* variables at build time
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.schooliat.com";

// Validate API URL is set
if (typeof window !== "undefined" && !BASE_URL) {
  console.log("API Base URL:", BASE_URL);
}

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
 * Get authentication token from storage
 */
async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const token = window.sessionStorage.getItem("accessToken");
    return token;
  } catch {
    return null;
  }
}

/**
 * Handle response status and errors
 */
async function handleResponseStatus(response: Response): Promise<any> {
  // Handle 401 Unauthorized
  if (response.status === 401) {
    await clearToken();
    apiEvents.emit(API_EVENTS.UNAUTHORIZED);
    throw new ApiError("Unauthorized. Please login again.", 401);
  }

  // Handle 403 Forbidden
  if (response.status === 403) {
    apiEvents.emit(API_EVENTS.FORBIDDEN);
    throw new ApiError("Access denied.", 403);
  }

  // Handle 500+ Server Errors
  if (response.status >= 500) {
    apiEvents.emit(API_EVENTS.SERVER_ERROR);
    throw new ApiError("Server error. Please try again later.", response.status);
  }

  // Handle network errors
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    throw new ApiError(
      errorData?.message || `Request failed with status ${response.status}`,
      response.status,
      errorData
    );
  }

  // Handle empty responses
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return null;
  }

  return response.json();
}

/**
 * Make HTTP request
 */
async function request(
  path: string,
  options: {
    method?: string;
    body?: any;
    query?: Record<string, any>;
    headers?: Record<string, string>;
  } = {}
): Promise<any> {
  const { method = "GET", body, query, headers = {} } = options;

  // Build URL
  const cleanBaseUrl = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  let url = `${cleanBaseUrl}${cleanPath}`;

  // Add query parameters
  if (query && Object.keys(query).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    url += `?${searchParams.toString()}`;
  }

  // Get auth token
  const token = await getAuthToken();

  // Prepare headers
  const requestHeaders: HeadersInit = {
    "Content-Type": "application/json",
    "x-platform": "web",
    ...headers,
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  // Prepare request options
  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  // Add body for non-GET requests
  if (body && method !== "GET") {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, requestOptions);
    return handleResponseStatus(response);
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      apiEvents.emit(API_EVENTS.NETWORK_ERROR);
      throw new ApiError(
        "Network error. Please check your connection and try again.",
        0
      );
    }
    throw error;
  }
}

// Convenience methods
export function get(path: string, query?: Record<string, any>): Promise<any> {
  return request(path, { method: "GET", query });
}

export function post(path: string, body?: any): Promise<any> {
  return request(path, { method: "POST", body });
}

export function put(path: string, body?: any): Promise<any> {
  return request(path, { method: "PUT", body });
}

export function del(path: string, body?: any): Promise<any> {
  return request(path, { method: "DELETE", body });
}

export function patch(path: string, body?: any): Promise<any> {
  return request(path, { method: "PATCH", body });
}

/**
 * Upload file
 */
export async function uploadFile(
  path: string,
  file: File,
  additionalData?: Record<string, any>
): Promise<any> {
  const cleanBaseUrl = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${cleanBaseUrl}${cleanPath}`;

  const token = await getAuthToken();

  const formData = new FormData();
  formData.append("file", file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
  }

  const headers: HeadersInit = {
    "x-platform": "web",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    return handleResponseStatus(response);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      apiEvents.emit(API_EVENTS.NETWORK_ERROR);
      throw new ApiError(
        "Network error. Please check your connection and try again.",
        0
      );
    }
    throw error;
  }
}

/**
 * Get file URL
 */
export function getFile(fileId: string): string {
  const cleanBaseUrl = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  return `${cleanBaseUrl}/files/${fileId}`;
}

/**
 * Reset user password
 */
export function resetUserPassword(email: string): Promise<any> {
  return post("/auth/forgot-password", {
    request: { email },
  });
}

/**
 * Change user password
 */
export function changeUserPassword(
  currentPassword: string,
  newPassword: string
): Promise<any> {
  return post("/auth/change-password", {
    request: {
      currentPassword,
      newPassword,
    },
  });
}

