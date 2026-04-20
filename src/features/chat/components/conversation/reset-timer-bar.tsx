"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { DepartmentTheme } from "@/features/cms/types/cms";

interface ResetTimerBarProps {
  targetTimestamp: number | null;
  durationSeconds: number;
  onClear: () => void;
  theme: DepartmentTheme;
  forceShowButton: boolean;
}

export function ResetTimerBar({
  targetTimestamp,
  durationSeconds,
  onClear,
  theme,
  forceShowButton,
}: ResetTimerBarProps) {
  const [timeLeft, setTimeLeft] = useState(() =>
    targetTimestamp
      ? Math.max(0, Math.floor((targetTimestamp - Date.now()) / 1000))
      : 0,
  );

  useEffect(() => {
    if (!targetTimestamp) {
      return;
    }

    setTimeLeft(Math.max(0, Math.floor((targetTimestamp - Date.now()) / 1000)));

    const handle = setInterval(() => {
      setTimeLeft(
        Math.max(0, Math.floor((targetTimestamp - Date.now()) / 1000)),
      );
    }, 1000);

    return () => clearInterval(handle);
  }, [targetTimestamp]);

  if (!targetTimestamp && !forceShowButton) {
    return null;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, "0");
  const progressPercent = targetTimestamp
    ? (timeLeft / durationSeconds) * 100
    : 0;

  return (
    <div className="flex items-center gap-4 rounded-xl bg-black/15 px-4 py-2.5 shadow-inner backdrop-blur-sm">
      {targetTimestamp !== null ? (
        <>
          <div className="flex w-52.5 flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/95">
              Cuộc trò chuyện sẽ làm mới sau: {minutes}:{seconds}
            </span>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white/90 transition-all duration-1000 ease-linear"
                style={{
                  width: `${Math.min(100, Math.max(0, progressPercent))}%`,
                }}
              />
            </div>
          </div>

          <div className="h-8 w-px bg-white/20" />
        </>
      ) : null}

      <button
        type="button"
        onClick={onClear}
        className="group flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-bold shadow-md transition-all hover:scale-105 hover:brightness-110 active:scale-95"
        style={{ color: theme.accent }}
      >
        <RotateCcw
          className="h-4 w-4 transition-transform group-hover:-rotate-90"
          strokeWidth={2.5}
        />
        <span>Làm mới ngay</span>
      </button>
    </div>
  );
}
