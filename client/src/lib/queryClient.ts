import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Get API URL from environment variable
// In production (Android app), this will be the Replit deployment URL
// In development (web), this will be empty string (same origin)
const API_URL = import.meta.env.VITE_API_URL || '';

export class HttpError extends Error {
  status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let message = await res.text();
    // If response body is empty, use statusText as fallback
    if (!message || message.trim() === '') {
      message = res.statusText || `HTTP Error ${res.status}`;
    }
    throw new HttpError(res.status, message);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = `${API_URL}${url}`;
  
  // Check if data is FormData (for file uploads)
  const isFormData = data instanceof FormData;
  
  const res = await fetch(fullUrl, {
    method,
    // Don't set Content-Type for FormData (browser will set it automatically with boundary)
    headers: data && !isFormData ? { "Content-Type": "application/json" } : {},
    // Don't stringify FormData
    body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const fullUrl = `${API_URL}${queryKey.join("/")}`;
    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
