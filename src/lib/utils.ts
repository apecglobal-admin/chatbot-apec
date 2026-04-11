import { clsx, type ClassValue } from 'clsx'
import { format } from 'date-fns'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Tạo timestamp theo định dạng yyMMdd-HHmmss, ví dụ: 260411-094815 */
export function generateTimestampId(date = new Date()) {
  return format(date, 'yyMMdd-HHmmss')
}
