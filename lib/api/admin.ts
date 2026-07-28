import {
  clearAdminTokens,
  getAdminAccessToken,
  getAdminRefreshToken,
  saveAdminTokens,
} from "@/lib/admin/auth";
import { apiBaseUrl } from "@/lib/carri-account";

export type AdminProfile = {
  reference: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  date_joined: string;
  updated_at: string;
};

export type AdminSession = {
  authenticated: boolean;
  admin: AdminProfile;
};

export type AdminLoginResponse = {
  access: string;
  refresh: string;
  admin: AdminProfile;
};

export async function loginAdmin(email: string, password: string): Promise<AdminLoginResponse> {
  const data = await fetchAdminJson<AdminLoginResponse>("/api/admin/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    includeAuth: false,
  });
  saveAdminTokens(data.access, data.refresh);
  return data;
}

export async function getAdminSession(): Promise<AdminSession> {
  return fetchAdminJson<AdminSession>("/api/admin/auth/me/");
}

export async function getAdminUsers(search = ""): Promise<AdminProfile[]> {
  const params = new URLSearchParams();
  if (search.trim()) {
    params.set("search", search.trim());
  }
  return fetchAdminJson<AdminProfile[]>(
    "/api/admin/users/" + (params.toString() ? "?" + params.toString() : ""),
  );
}

export async function logoutAdmin() {
  const refresh = getAdminRefreshToken();
  try {
    if (refresh) {
      await fetchAdminJson<{ detail: string }>("/api/admin/auth/logout/", {
        method: "POST",
        body: JSON.stringify({ refresh }),
      });
    }
  } finally {
    clearAdminTokens();
  }
}

async function fetchAdminJson<T>(
  path: string,
  options: RequestInit & { includeAuth?: boolean } = {},
): Promise<T> {
  const { includeAuth = true, ...init } = options;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.body ? { "Content-Type": "application/json" } : {}),
  };
  const accessToken = getAdminAccessToken();

  if (includeAuth) {
    if (!accessToken) {
      throw new Error("Session administrateur introuvable.");
    }
    headers.Authorization = "Bearer " + accessToken;
  }

  const response = await fetch(apiBaseUrl.replace(/\/$/, "") + path, {
    cache: "no-store",
    ...init,
    headers: {
      ...headers,
      ...init.headers,
    },
  });
  const responseText = await response.text();
  const data = parseJson(responseText);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Action administrateur impossible."));
  }

  return data as T;
}

function parseJson(value: string): unknown {
  if (!value.trim()) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getApiErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const record = data as Record<string, unknown>;
  if (typeof record.detail === "string") {
    return record.detail;
  }

  const firstValue = Object.values(record)[0];
  if (Array.isArray(firstValue) && typeof firstValue[0] === "string") {
    return firstValue[0];
  }

  if (typeof firstValue === "string") {
    return firstValue;
  }

  return fallback;
}
