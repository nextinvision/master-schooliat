import { saveToken } from "@/lib/auth/storage";
import { post } from "./client";

// API Base URL - must be set in environment variables
// This variable is REQUIRED and must be set at build time
if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL environment variable is required. " +
    "Please set it in your .env file (e.g., NEXT_PUBLIC_API_URL=https://api.schooliat.com)"
  );
}
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function loginAndSaveToken(
  email: string,
  password: string
): Promise<any> {
  // Ensure BASE_URL doesn't end with / and path starts with /
  const cleanBaseUrl = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  const res = await fetch(`${cleanBaseUrl}/auth/authenticate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-platform": "web",
    },
    body: JSON.stringify({
      request: {
        email,
        password,
      },
    }),
  });

  if (!res.ok) {
    // Try to parse error response for better error messages
    let errorData = null;
    try {
      const errorText = await res.text();
      try {
        errorData = JSON.parse(errorText);
      } catch {
        // Response was not JSON
      }
    } catch {
      // Could not read response
    }

    // Don't expose response body which might contain sensitive information
    let errorMessage = "Login failed";
    if (res.status === 401) {
      errorMessage = "Invalid email or password";
    } else if (res.status === 403) {
      errorMessage = "Access denied";
    } else if (res.status === 404) {
      // Backend returns 404 for "User not found" - treat as invalid credentials
      errorMessage = errorData?.message || "Invalid email or password";
    } else if (res.status >= 500) {
      errorMessage = "Server error";
    } else {
      errorMessage = errorData?.message || `Login failed (${res.status})`;
    }
    throw new Error(errorMessage);
  }

  const data = await res.json();
  if (!data.token) {
    throw new Error("Login response missing token");
  }

  await saveToken(data.token);
  return data;
}

