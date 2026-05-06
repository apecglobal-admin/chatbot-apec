import { cn } from "@/shared/utils/ui";
import { ScanLine } from "lucide-react";
import QRCode from "react-qr-code";
import type { DepartmentTheme } from "@/features/cms/types/cms";

interface ChatDeeplinkQrProps {
  url: string;
  label: string;
  theme: DepartmentTheme;
  isUser: boolean;
}

export function ChatDeeplinkQr({
  url,
  label,
  theme,
  isUser,
}: ChatDeeplinkQrProps) {
  return (
    <div
      className={cn(
        "my-2 flex w-fit max-w-full flex-col items-center gap-4 rounded-xl border p-4 sm:flex-row sm:items-center",
        isUser ? "border-white/20 bg-white/10" : "border-slate-200 bg-slate-50",
      )}
    >
      <div className="flex shrink-0 flex-col items-center gap-2 rounded-lg bg-white p-2 shadow-sm">
        <QRCode value={url} size={100} />
      </div>
      <div className="flex w-min flex-col justify-center gap-1.5 py-1">
        <div
          className={cn(
            "flex items-start gap-1.5 font-medium sm:items-center",
            isUser ? "text-white" : "text-slate-900",
          )}
        >
          <ScanLine className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" />
          <span className="whitespace-nowrap">Quét mã QR để {label}</span>
        </div>
        <p
          className={cn(
            "text-xs",
            isUser ? "text-white/80" : "text-slate-500",
          )}
        >
          Sử dụng camera trên điện thoại của bạn để quét mã này.
        </p>
      </div>
    </div>
  );
}
