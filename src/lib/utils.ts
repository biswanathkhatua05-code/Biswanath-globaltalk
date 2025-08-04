import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp, FieldValue } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(timestamp: number | Timestamp | FieldValue): string {
  // TODO: Handle FieldValue appropriately. This might involve fetching the actual timestamp after the data is written.
  return "timestamp";
}
