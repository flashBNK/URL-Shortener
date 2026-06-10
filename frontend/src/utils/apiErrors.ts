import { ApiError } from "../api/types";
import type { TranslationKey } from "../i18n/translations";
import type { LinkFieldError } from "./linkValidation";

type Translate = (key: TranslationKey) => string;

type CreateLinkError = {
  field: LinkFieldError;
  message: string;
};

export function getApiErrorMessage(error: unknown, fallback: TranslationKey, t: Translate) {
  if (!(error instanceof ApiError)) {
    return t(fallback);
  }

  if (error.code === "unauthorized") {
    return t("errors.sessionExpired");
  }

  if (error.code === "rate_limit") {
    return t("errors.rateLimit");
  }

  if (error.code === "network_error" || error.status === 0) {
    return t("errors.network");
  }

  if (error.status === 403) {
    return t("errors.forbidden");
  }

  return t(fallback);
}

function includesAny(value: string, patterns: string[]) {
  return patterns.some((pattern) => value.includes(pattern));
}

export function getCreateLinkError(error: unknown, t: Translate): CreateLinkError {
  const fallback = {
    field: "form",
    message: t("errors.createLink"),
  } satisfies CreateLinkError;

  if (!(error instanceof ApiError)) {
    return fallback;
  }

  const message = error.message.toLowerCase();

  if (error.code === "network_error" || error.status === 0) {
    return {
      field: "form",
      message: t("errors.network"),
    };
  }

  if (error.code === "unauthorized" || error.status === 401) {
    return {
      field: "form",
      message: t("errors.sessionExpired"),
    };
  }

  if (error.code === "rate_limit" || error.status === 429) {
    return {
      field: "form",
      message: t("errors.rateLimit"),
    };
  }

  if (error.status === 400 && message.includes("invalid url")) {
    return {
      field: "url",
      message: t("linkForm.errorUrlInvalidOrUnavailable"),
    };
  }

  if (error.status === 400 && message.includes("unsafe url")) {
    return {
      field: "url",
      message: t("linkForm.errorUrlUnsafe"),
    };
  }

  if (error.status === 409) {
    if (includesAny(message, ["short_url", "short url", "alias"])) {
      return {
        field: "customAlias",
        message: t("linkForm.errorAliasTaken"),
      };
    }

    if (includesAny(message, ["url", "link"])) {
      return {
        field: "url",
        message: t("linkForm.errorLinkExists"),
      };
    }

    return {
      field: "form",
      message: t("linkForm.errorLinkExists"),
    };
  }

  if (error.status === 422) {
    return {
      field: "form",
      message: t("linkForm.errorCheckFields"),
    };
  }

  if (error.status >= 500) {
    return {
      field: "form",
      message: t("linkForm.errorCreateUnavailable"),
    };
  }

  return fallback;
}
