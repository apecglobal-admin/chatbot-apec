import type { DepartmentConfig } from "@/types/cms";

export type CmsView = "dashboard" | "department";

export const themeFields: Array<{
  field: keyof DepartmentConfig["theme"];
  label: string;
  hint?: string;
}> = [
  {
    field: "accent",
    label: "Màu chủ đạo",
    hint: "Màu nền tiêu đề (Header), nút Gửi và các vòng tròn hiệu ứng khi nói.",
  },
  {
    field: "userBubble",
    label: "Tin nhắn khách",
    hint: "Màu sắc của ô tin nhắn do người dùng gửi đi.",
  },
  {
    field: "panel",
    label: "Nền web",
    hint: "Màu nền bao phủ phía sau toàn bộ cửa sổ Chat.",
  },
  {
    field: "surface",
    label: "Nền khung chat",
    hint: "Màu nền của hộp chứa nội dung chat.",
  },
  {
    field: "accentSoft",
    label: "Nền trên nhãn & thẻ",
    hint: "Dùng cho các biểu tượng phụ hoặc trạng thái phụ.",
  },
  {
    field: "badge",
    label: "Chữ trên nhãn & thẻ",
    hint: "Màu văn bản của các nhãn trạng thái hoặc thông báo nhỏ.",
  },
  {
    field: "suggestedPromptsBgColor",
    label: "Nền gợi ý câu hỏi",
    hint: "Nền các nút gợi ý câu hỏi nằm trên ô nhập liệu.",
  },
  {
    field: "suggestedPromptsTextColor",
    label: "Chữ gợi ý câu hỏi",
    hint: "Màu chữ bên trong các nút gợi ý câu hỏi.",
  },
];
