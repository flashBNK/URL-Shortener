import type { Language } from "../i18n/translations";

export function formatDate(value: string | null, language: Language, options: Intl.DateTimeFormatOptions = {}) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    dateStyle: "medium",
    ...options,
  }).format(date);
}

export function formatDateTime(value: string, language: Language) {
  return formatDate(value, language, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
