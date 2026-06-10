import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "../auth/tokenStore";
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

let refreshPromise: Promise<TokenSchema> | null = null;

type RequestOptions = {
  auth?: boolean;
  query?: Record<string, string | number | boolean | null | undefined>;
};

const fallbackRetryAfterSeconds = 30;

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

function getRetryAfterSeconds(response: Response): number {
  const retryAfter = response.headers.get("Retry-After");

  if (!retryAfter) {
    return fallbackRetryAfterSeconds;
  }

  const retryAfterNumber = Number(retryAfter);
  if (Number.isFinite(retryAfterNumber) && retryAfterNumber > 0) {
    return Math.ceil(retryAfterNumber);
  }

  const retryAfterDate = Date.parse(retryAfter);
  if (Number.isNaN(retryAfterDate)) {
    return fallbackRetryAfterSeconds;
  }

  return Math.max(1, Math.ceil((retryAfterDate - Date.now()) / 1000));
}

function createRateLimitError(response: Response) {
  const retryAfterSeconds = getRetryAfterSeconds(response);

  return new ApiError(response.status, "rate_limit", "rate_limit", {
    retryAfterSeconds,
    retryAt: Date.now() + retryAfterSeconds * 1000,
  });
}

async function refreshTokens(refreshToken: string): Promise<TokenSchema> {
  const response = await fetch(buildUrl("/auth/token/refresh"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);

    if (response.status === 401) {
      throw new ApiError(response.status, "unauthorized", "unauthorized");
    }

    if (response.status === 429) {
      throw createRateLimitError(response);
    }

    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<TokenSchema>;
}

function getSharedRefreshPromise(refreshToken: string): Promise<TokenSchema> {
  if (!refreshPromise) {
    if (import.meta.env.DEV) {
      console.debug("access token expired, refreshing");
    }

    refreshPromise = refreshTokens(refreshToken)
      .then((tokens) => {
        if (import.meta.env.DEV) {
          console.debug("refresh succeeded");
        }
        return tokens;
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.debug("refresh failed");
        }
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
  retryOnUnauthorized = true,
): Promise<T> {
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
      if (options.auth && retryOnUnauthorized) {
        const refreshToken = getRefreshToken();

        if (refreshToken) {
          try {
            const tokens = await getSharedRefreshPromise(refreshToken);
            saveTokens(tokens);
            return request<T>(path, init, options, false);
          } catch {
            clearTokens();
            throw new ApiError(response.status, "unauthorized", "unauthorized");
          }
        }
      }

      clearTokens();
      throw new ApiError(response.status, "unauthorized", "unauthorized");
    }

    if (response.status === 429) {
      throw createRateLimitError(response);
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
  refreshToken(refreshToken: string) {
    return refreshTokens(refreshToken);
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
  updateUser(payload: { username?: string; email?: string }) {
    return request<UserSchema>(
      "/user",
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      { auth: true },
    );
  },
  changePassword(payload: { current_password: string; new_password: string }) {
    return request<void>(
      "/user/change-password",
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
      { auth: true },
    );
  },
  deleteAccount(payload: { current_password: string }) {
    return request<void>(
      "/user",
      {
        method: "DELETE",
        body: JSON.stringify(payload),
      },
      { auth: true },
    );
  },
  logout() {
    return request<void>("/auth/logout", { method: "POST" }, { auth: true });
  },
  revokeAllTokens() {
    return request<void>("/auth/revoke-all", { method: "POST" }, { auth: true });
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
          throw createRateLimitError(response);
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
  deleteLink(shortUrl: string) {
    return request<void>(
      `/link/${encodeURIComponent(shortUrl)}`,
      {
        method: "DELETE",
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
