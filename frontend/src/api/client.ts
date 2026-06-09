import { clearTokens, getAccessToken } from "../auth/tokenStore";
import {
  ApiError,
  type CreateLinkPayload,
  type GroupByCountryLinkSchema,
  type LinkSchema,
  type ListLinkClicksSchema,
  type ListLinksSchema,
  type TokenSchema,
  type UpdateLinkPayload,
  type UserSchema,
} from "./types";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");
const apiV1Url = `${apiBaseUrl}/api/v1`;

type RequestOptions = {
  auth?: boolean;
  query?: Record<string, string | number | boolean | null | undefined>;
};

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${apiV1Url}${path}`);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function readErrorMessage(response: Response): Promise<string> {
  const fallback = response.statusText || "Request failed";

  try {
    const data = await response.json();
    if (typeof data.detail === "string") {
      return data.detail;
    }
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item: { msg?: string }) => item.msg ?? JSON.stringify(item))
        .join("; ");
    }
    return data.message ?? fallback;
  } catch {
    return fallback;
  }
}

async function request<T>(path: string, init: RequestInit = {}, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(buildUrl(path, options.query), {
    ...init,
    headers,
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);

    if (response.status === 401) {
      clearTokens();
      throw new ApiError(response.status, "unauthorized", "unauthorized");
    }

    if (response.status === 429) {
      throw new ApiError(response.status, "rate_limit", "rate_limit");
    }

    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const publicBaseUrl = apiBaseUrl;

export const api = {
  login(payload: { username: string; password: string }) {
    return request<TokenSchema>("/auth/token", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  register(payload: { username: string; email: string; password: string }) {
    return request<UserSchema>("/user", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  getMe() {
    return request<UserSchema>("/user/me", {}, { auth: true });
  },
  logout() {
    return request<void>("/auth/logout", { method: "POST" }, { auth: true });
  },
  createLink(payload: CreateLinkPayload, auth = false) {
    return request<LinkSchema>(
      "/link/",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      { auth },
    );
  },
  getMyLinks(limit = 20, offset = 0) {
    return request<ListLinksSchema>("/link/me", {}, { auth: true, query: { limit, offset } });
  },
  getPublicLinks(limit = 10, offset = 0) {
    const url = new URL(`${apiBaseUrl}/public`);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));

    return fetch(url.toString()).then(async (response) => {
      if (!response.ok) {
        const message = await readErrorMessage(response);

        if (response.status === 429) {
          throw new ApiError(response.status, "rate_limit", "rate_limit");
        }

        throw new ApiError(response.status, message);
      }

      return response.json() as Promise<ListLinksSchema>;
    });
  },
  getLink(shortUrl: string) {
    return request<LinkSchema>(`/link/${encodeURIComponent(shortUrl)}`);
  },
  updateLink(shortUrl: string, payload: UpdateLinkPayload) {
    return request<LinkSchema>(
      `/link/${encodeURIComponent(shortUrl)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      { auth: true },
    );
  },
  getClicks(shortUrl: string, limit = 10, offset = 0) {
    return request<ListLinkClicksSchema>(
      `/link/${encodeURIComponent(shortUrl)}/clicks`,
      {},
      { auth: true, query: { limit, offset } },
    );
  },
  getStats(shortUrl: string) {
    return request<GroupByCountryLinkSchema>(`/link/${encodeURIComponent(shortUrl)}/stats`, {}, { auth: true });
  },
};
