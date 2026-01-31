import { saveToken } from "@/lib/auth/storage";
import { post } from "./client";

// API Base URL - must be set in .env.local
// Production: https://schooliat-backend.onrender.com
// Development: http://localhost:3000
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://schooliat-backend.onrender.com";

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
    // Don't expose response body which might contain sensitive information
    let errorMessage = "Login failed";
    if (res.status === 401) {
      errorMessage = "Invalid email or password";
    } else if (res.status === 403) {
      errorMessage = "Access denied";
    } else if (res.status === 404) {
      errorMessage = "Service not found";
    } else if (res.status >= 500) {
      errorMessage = "Server error";
    } else {
      errorMessage = `Login failed (${res.status})`;
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

