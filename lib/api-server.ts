import { cookies } from "next/headers";

export async function serverApi<T>(
  endpoint: string
): Promise<T> {
  const cookieStore = await cookies();

  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const baseUrl =
    process.env.APP_URL || "http://localhost:3000";

  const response = await fetch(`${baseUrl}${endpoint}`, {
    headers: {
      Cookie: cookieHeader,
    },
    cache: "no-store",
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || "Request failed");
  }

  return result as T;
}