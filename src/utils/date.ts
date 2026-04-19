import { format } from "date-fns"

/** Tạo timestamp theo định dạng yyMMdd-HHmmss, ví dụ: 260411-094815 */
export function generateTimestampId(date = new Date()) {
  return format(date, "yyMMdd-HHmmss")
}

/** Định dạng ngày giờ cho hiển thị (ví dụ: 20 thg 4, 17:00) */
export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

/** Định dạng chỉ giờ và phút cho tin nhắn chat (ví dụ: 17:00) */
export function formatChatTimestamp(date = new Date()) {
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })
}
