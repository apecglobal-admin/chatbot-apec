"use client";

import type { DepartmentTheme } from "@/lib/cms-types";
import { hexToRgba } from "@/lib/color";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

import { BotAvatar } from "./bot-avatar";

function useTypewriter(content: string, enabled: boolean) {
  const [displayed, setDisplayed] = useState(() => content);
  const contentRef = useRef(content);
  const indexRef = useRef(content.length);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => {
      const target = contentRef.current;
      if (indexRef.current < target.length) {
        const diff = target.length - indexRef.current;
        const charsToAdd = Math.max(1, Math.floor(diff * 0.25));
        indexRef.current += charsToAdd;
        setDisplayed(target.substring(0, indexRef.current));
      }
    }, 15); // 60fps catch up
    return () => clearInterval(timer);
  }, [enabled]);

  return enabled ? displayed : content;
}

// Regex to match URLs that point to images (by extension or known image hosts)
const IMAGE_URL_REGEX =
  /https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|gif|webp|svg|bmp|ico|avif)(?:\?[^\s"'<>]*)?/gi;

function MessageContent({ content }: { content: string }) {
  const parts: { type: "text" | "image"; value: string }[] = [];
  let lastIndex = 0;

  // Reset regex state
  IMAGE_URL_REGEX.lastIndex = 0;
  let match = IMAGE_URL_REGEX.exec(content);

  while (match) {
    // Text before this image URL
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        value: content.slice(lastIndex, match.index),
      });
    }
    parts.push({ type: "image", value: match[0] });
    lastIndex = match.index + match[0].length;
    match = IMAGE_URL_REGEX.exec(content);
  }

  // Remaining text after last match
  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }

  // No images found – render as plain text
  if (parts.every((p) => p.type === "text")) {
    return <p className="whitespace-pre-wrap text-sm leading-6">{content}</p>;
  }

  return (
    <div className="space-y-2 text-sm leading-6">
      {parts.map((part, index) =>
        part.type === "image" ? (
          <a
            key={index}
            href={part.value}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={part.value}
              alt="Ảnh trong tin nhắn"
              className="max-h-[300px] w-auto rounded-xl object-contain transition hover:scale-[1.02]"
              loading="lazy"
            />
          </a>
        ) : (
          <p key={index} className="whitespace-pre-wrap">
            {part.value}
          </p>
        ),
      )}
    </div>
  );
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  theme: DepartmentTheme;
}

export function ChatMessage({
  role,
  content,
  timestamp,
  theme,
}: ChatMessageProps) {
  const isUser = role === "user";

  // Only animate if it's an assistant message and it started as empty (a new streaming message)
  const [shouldAnimate] = useState(() => !isUser && content === "");
  const displayedContent = useTypewriter(content, shouldAnimate);

  return (
    <div
      className={cn(
        "flex max-w-[90%] gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto",
      )}
    >
      {!isUser ? <BotAvatar theme={theme} /> : null}

      <div className="flex flex-col gap-1.5">
        <div
          className={cn(
            "rounded-[24px] border px-4 py-3.5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]",
            isUser
              ? "rounded-br-md text-white"
              : "rounded-bl-md bg-white/92 text-slate-900",
          )}
          style={{
            background: isUser
              ? `linear-gradient(135deg, ${theme.userBubble}, ${theme.accent})`
              : undefined,
            borderColor: isUser
              ? hexToRgba(theme.accent, 0.08)
              : hexToRgba(theme.accent, 0.14),
          }}
        >
          <MessageContent content={displayedContent} />
        </div>
        {timestamp ? (
          <span
            className={cn(
              "text-[11px] text-slate-400",
              isUser ? "mr-1 text-right" : "ml-1 text-left",
            )}
          >
            {timestamp}
          </span>
        ) : null}
      </div>
    </div>
  );
}
