"use client";

import type { DepartmentTheme } from "@/types/cms";
import { hexToRgba } from "@/utils/color";
import { cn } from "@/utils/ui";
import { useEffect, useRef, useState } from "react";
import type { ChatRole } from "@/types/chat";

import { BotAvatar } from "../shared/bot-avatar";

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

// Regex to match markdown links: [text](url)
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi;

type Token =
  | { type: "text"; value: string }
  | { type: "image"; value: string }
  | { type: "link"; text: string; url: string };

function MessageContent({
  content,
  theme,
  isUser,
}: {
  content: string;
  theme: DepartmentTheme;
  isUser: boolean;
}) {
  const matches: { index: number; length: number; token: Token }[] = [];

  // Find images
  IMAGE_URL_REGEX.lastIndex = 0;
  let imgMatch;
  while ((imgMatch = IMAGE_URL_REGEX.exec(content)) !== null) {
    matches.push({
      index: imgMatch.index,
      length: imgMatch[0].length,
      token: { type: "image", value: imgMatch[0] },
    });
  }

  // Find markdown links
  MARKDOWN_LINK_REGEX.lastIndex = 0;
  let linkMatch;
  while ((linkMatch = MARKDOWN_LINK_REGEX.exec(content)) !== null) {
    matches.push({
      index: linkMatch.index,
      length: linkMatch[0].length,
      token: { type: "link", text: linkMatch[1], url: linkMatch[2] },
    });
  }

  // Sort matches by index to handle them in order
  matches.sort((a, b) => a.index - b.index);

  // Filter out overlapping matches
  const nonOverlapping: typeof matches = [];
  let lastEnd = 0;
  for (const m of matches) {
    if (m.index >= lastEnd) {
      nonOverlapping.push(m);
      lastEnd = m.index + m.length;
    }
  }

  const tokens: Token[] = [];
  let lastPos = 0;
  for (const m of nonOverlapping) {
    if (m.index > lastPos) {
      tokens.push({ type: "text", value: content.slice(lastPos, m.index) });
    }
    tokens.push(m.token);
    lastPos = m.index + m.length;
  }

  if (lastPos < content.length) {
    tokens.push({ type: "text", value: content.slice(lastPos) });
  }

  // If it's just a single text token, keep it simple
  if (tokens.length === 1 && tokens[0].type === "text") {
    return <p className="whitespace-pre-wrap text-sm leading-6">{content}</p>;
  }

  return (
    <div className="space-y-2 text-sm leading-6">
      {tokens.map((token, index) => {
        if (token.type === "image") {
          return (
            <a
              key={index}
              href={token.value}
              target="_blank"
              rel="noopener noreferrer"
              className="my-2 block w-full overflow-hidden rounded-xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={token.value}
                alt="Ảnh trong tin nhắn"
                className="max-h-75 w-auto rounded-xl object-contain transition hover:scale-[1.02]"
                loading="lazy"
              />
            </a>
          );
        }

        if (token.type === "link") {
          return (
            <a
              key={index}
              href={token.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex font-medium transition-all hover:underline",
                isUser
                  ? "text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
                  : "underline decoration-slate-300 underline-offset-4 hover:decoration-current",
              )}
              style={{
                color: !isUser ? theme.accent : undefined,
              }}
            >
              {token.text}
            </a>
          );
        }

        return (
          <span key={index} className="whitespace-pre-wrap">
            {token.value}
          </span>
        );
      })}
    </div>
  );
}

interface ChatMessageProps {
  role: ChatRole;
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
            "rounded-3xl border px-4 py-2 shadow-[0_12px_32px_rgba(15,23,42,0.06)]",
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
          <MessageContent
            content={displayedContent}
            theme={theme}
            isUser={isUser}
          />
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
