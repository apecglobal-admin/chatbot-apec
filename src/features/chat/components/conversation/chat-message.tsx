"use client";

import type { DepartmentTheme } from "@/features/cms/types/cms";
import { hexToRgba } from "@/shared/utils/color";
import { cn } from "@/shared/utils/ui";
import { useEffect, useRef, useState } from "react";
import { Link2 } from "lucide-react";
import type { ChatRole } from "@/features/chat/types/chat";

import { BotAvatar } from "@/features/chat/components/shared/bot-avatar";
import { ChatDeeplinkQr } from "./chat-deeplink-qr";

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
  /https?:\/\/[^\s"<>]+\.(?:png|jpe?g|gif|webp|svg|bmp|ico|avif)(?:\?[^\s"<>]*)?/gi;

// Regex to match markdown links: [text](url) — supports any scheme
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\(([a-z][a-z0-9+.-]*:\/\/[^\s)]+)\)/gi;

// Regex to match bare URLs with any scheme (catches custom schemes like apec-space://)
const BARE_URL_REGEX = /[a-z][a-z0-9+.-]*:\/\/[^\s"<>]+/gi;

const COMMON_HOST_PREFIXES = new Set(["www", "m", "app", "open", "gateway"]);

function getLinkLabel(url: string, label?: string) {
  const trimmed = label?.trim();
  if (trimmed && !/^https?:\/\//i.test(trimmed)) return trimmed;

  try {
    const parsed = new URL(url);
    const scheme = parsed.protocol.replace(/:$/, "");

    // Custom scheme (non-http) → use scheme name as label
    if (!/^https?$/i.test(scheme)) {
      const base = scheme.replace(/[-_]+/g, " ").trim();
      return base ? `Mở ${base.charAt(0).toUpperCase() + base.slice(1)}` : "Mở liên kết";
    }

    const parts = parsed.hostname
      .replace(/^www\./i, "")
      .split(".")
      .filter(Boolean);
    const filtered = parts.filter((p) => !COMMON_HOST_PREFIXES.has(p.toLowerCase()));
    const normalized = filtered.length ? filtered : parts;
    if (!normalized.length) return "Mở liên kết";

    const lastIdx = normalized.length - 1;
    const baseIdx =
      lastIdx >= 2 && normalized[lastIdx - 1].length <= 3
        ? lastIdx - 2
        : Math.max(0, lastIdx - 1);
    const base = (normalized[baseIdx] ?? normalized[0]).replace(/[-_]+/g, " ").trim();
    return base ? `Mở ${base.charAt(0).toUpperCase() + base.slice(1)}` : "Mở liên kết";
  } catch {
    return "Mở liên kết";
  }
}

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

  // Find bare URLs (any scheme, including custom like apec-space://)
  BARE_URL_REGEX.lastIndex = 0;
  let bareMatch;
  while ((bareMatch = BARE_URL_REGEX.exec(content)) !== null) {
    matches.push({
      index: bareMatch.index,
      length: bareMatch[0].length,
      token: { type: "link", text: bareMatch[0], url: bareMatch[0] },
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
          const linkLabel = getLinkLabel(token.url, token.text !== token.url ? token.text : undefined);
          const isDeeplink = !/^https?:\/\//i.test(token.url);

          if (isDeeplink) {
            return (
              <ChatDeeplinkQr
                key={index}
                url={token.url}
                label={linkLabel}
                theme={theme}
                isUser={isUser}
              />
            );
          }

          return (
            <a
              key={index}
              href={token.url}
              target="_blank"
              rel="noopener noreferrer"
              title={token.url}
              className={cn(
                "my-0.5 inline-flex max-w-full items-start gap-1.5 align-middle font-medium underline underline-offset-2 transition-all hover:opacity-80",
                isUser
                  ? "text-white decoration-white/40 hover:decoration-white"
                  : "decoration-current/40 hover:decoration-current",
              )}
              style={{
                color: !isUser ? theme.accent : undefined,
              }}
            >
              <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" />
              <span className="text-sm leading-tight break-all">
                {linkLabel}
              </span>
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
