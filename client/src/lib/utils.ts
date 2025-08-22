import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Debounce function to limit how often a function can be called
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Convert a rating from 0-5 to an array of filled/empty stars
export function getRatingStars(rating: number): boolean[] {
  const starsArray: boolean[] = [];
  const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5
  
  for (let i = 1; i <= 5; i++) {
    starsArray.push(i <= roundedRating);
  }
  
  return starsArray;
}

// Format a date to a readable string
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
}

// Format timestamp for chat messages
export function formatMessageTime(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
}
