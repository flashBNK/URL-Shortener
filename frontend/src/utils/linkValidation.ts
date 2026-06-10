import type { TranslationKey } from "../i18n/translations";

export type LinkFieldError = "url" | "customAlias" | "form";

export const maxUrlLength = 511;
export const minAliasLength = 4;
export const maxAliasLength = 12;
export const aliasPattern = /^[A-Za-z0-9_-]+$/;

export function validateCreateLinkUrl(value: string): TranslationKey | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "linkForm.errorUrlInvalid";
  }

  if (trimmedValue.length > maxUrlLength) {
    return "linkForm.errorUrlTooLong";
  }

  if (/\s/.test(trimmedValue)) {
    return "linkForm.errorUrlSpaces";
  }

  const urlToValidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmedValue) ? trimmedValue : `https://${trimmedValue}`;

  try {
    const parsedUrl = new URL(urlToValidate);
    return parsedUrl.hostname ? null : "linkForm.errorUrlInvalid";
  } catch {
    return "linkForm.errorUrlInvalid";
  }
}

export function validateOptionalAlias(value: string): TranslationKey | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (trimmedValue.length < minAliasLength) {
    return "linkForm.errorAliasTooShort";
  }

  if (trimmedValue.length > maxAliasLength) {
    return "linkForm.errorAliasTooLong";
  }

  if (!aliasPattern.test(trimmedValue)) {
    return "linkForm.errorAliasPattern";
  }

  return null;
}
