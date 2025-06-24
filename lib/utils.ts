import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns a short, cryptographically-safe id (16 hex chars).
 */
export function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16)
}
