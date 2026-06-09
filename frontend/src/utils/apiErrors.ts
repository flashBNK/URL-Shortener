import { ApiError } from "../api/types";
import type { TranslationKey } from "../i18n/translations";

type Translate = (key: TranslationKey) => string;

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

  return error.message || t(fallback);
}
