import { isValidObjectId } from 'mongoose';

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 6;

/** Reads a request value as a trimmed string ('' if it is missing or not a string). */
export function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** True when the value is a valid MongoDB ObjectId string. */
export function isValidId(value: unknown): value is string {
  return typeof value === 'string' && isValidObjectId(value);
}

/** Shape of an idempotency key / request id sent by the app: 8–64 letters, digits or dashes (a UUID fits). */
export const REQUEST_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;
