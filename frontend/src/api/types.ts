export type ApiErrorCode = "unauthorized" | "rate_limit" | "api_error";

export class ApiError extends Error {
  status: number;
  code: ApiErrorCode;
  retryAfterSeconds?: number;
  retryAt?: number;

  constructor(
    status: number,
    message: string,
    code: ApiErrorCode = "api_error",
    options: { retryAfterSeconds?: number; retryAt?: number } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.retryAt = options.retryAt;
  }
}

export type TokenSchema = {
  access_token: string;
  refresh_token: string;
  refresh_token_expires_in: string;
  access_token_expires_in: string;
};

export type UserSchema = {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
};

export type LinkSchema = {
  id: number;
  url: string;
  short_url: string;
  total: number;
  is_active: boolean;
  expires_at: string | null;
  user_id: number | null;
};

export type LinkShortSchema = {
  url: string;
  short_url: string;
  total: number;
  is_active: boolean;
  expires_at: string | null;
};

export type ListLinksSchema = {
  items: LinkShortSchema[];
  total: number;
  limit: number;
  offset: number;
};

export type LinkClickSchema = {
  ip: string;
  country: string | null;
  user_agent: string | null;
  clicked_at: string;
};

export type ListLinkClicksSchema = {
  items: LinkClickSchema[];
  total: number;
  limit: number;
  offset: number;
};

export type GroupByCountryLinkSchema = {
  link_id: number;
  total: number;
  by_country: Record<string, number>;
  clicks_by_device: Record<string, number>;
  clicks_by_date: Record<string, number>;
};

export type CreateLinkPayload = {
  url: string;
  custom_alias?: string | null;
};

export type UpdateLinkPayload = {
  short_url?: string | null;
  is_active?: boolean | null;
  expires_at?: string | null;
};
