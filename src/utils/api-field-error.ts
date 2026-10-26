import { ApiError } from '../types/api';

type ApiFieldDetail = {
  field?: unknown;
  path?: unknown;
  property?: unknown;
  message?: unknown;
  messages?: unknown;
};

function isFieldPath(value: unknown, field: string): boolean {
  if (Array.isArray(value)) return value.some((segment) => segment === field);
  if (typeof value !== 'string') return false;
  return value === field || value.endsWith(`.${field}`) || new RegExp(`\\b${field}\\b`).test(value);
}

/** Returns a field-level validation message without discarding the form values. */
export function getApiFieldError(error: unknown, field: string, fallback: string): string | undefined {
  if (!(error instanceof ApiError) || (error.status !== 400 && error.status !== 422)) return undefined;

  for (const detail of error.details ?? []) {
    if (typeof detail === 'string') {
      if (isFieldPath(detail, field)) return fallback;
      continue;
    }
    if (!detail || typeof detail !== 'object') continue;

    const fieldDetail = detail as ApiFieldDetail;
    if (![fieldDetail.field, fieldDetail.path, fieldDetail.property].some((value) => isFieldPath(value, field))) continue;

    if (typeof fieldDetail.message === 'string' && fieldDetail.message.trim()) {
      return fieldDetail.message;
    }

    if (Array.isArray(fieldDetail.messages)) {
      const firstMessage = fieldDetail.messages.find((value): value is string => typeof value === 'string' && value.trim().length > 0);
      return firstMessage ?? fallback;
    }

    return fallback;
  }

  return undefined;
}
