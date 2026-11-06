const API_URL = "";

interface RequestOptions extends RequestInit {
  body?: BodyInit | null;
}

export async function api<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message || result?.error || "Something went wrong"
    );
  }

  return result as T;
}

export function getError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred";
}