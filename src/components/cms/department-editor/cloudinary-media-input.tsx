"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Save, Upload, UploadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { cmsInsetClass, cmsInputClass } from "../shared/styles";

interface CloudinaryMediaInputProps {
  accept: string;
  placeholder: string;
  resourceType: "image" | "video";
  value: string;
  onChange: (value: string) => void;
  onUploadComplete?: (value: string) => Promise<void> | void;
}

export function CloudinaryMediaInput({
  accept,
  placeholder,
  resourceType,
  value,
  onChange,
  onUploadComplete,
}: CloudinaryMediaInputProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");

  useEffect(() => {
    if (!selectedFile) {
      setLocalPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setLocalPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  async function handleUpload() {
    if (!selectedFile) {
      setErrorMessage("Hãy chọn file trước khi upload.");
      return;
    }

    setIsUploading(true);
    setErrorMessage("");

    try {
      const payload = new FormData();
      payload.append("file", selectedFile);
      payload.append("resourceType", resourceType);

      const response = await fetch("/api/cms-media", {
        method: "POST",
        body: payload,
      });

      const data = (await response.json()) as {
        secureUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.secureUrl) {
        throw new Error(data.error || "Upload Cloudinary thất bại.");
      }

      onChange(data.secureUrl);
      await onUploadComplete?.(data.secureUrl);
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Upload Cloudinary thất bại.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  const previewSrc = localPreviewUrl || value;
  const hasPreview = Boolean(previewSrc);
  const showMeta = Boolean(selectedFile || errorMessage || hasPreview);
  const fileLabel = selectedFile?.name ?? "";

  return (
    <div className="space-y-2.5">
      <div className="relative">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(cmsInputClass, "pr-[5.5rem]")}
          placeholder={placeholder}
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            title="Tải lên"
            aria-label="Tải lên"
          >
            <UploadIcon className="h-4 w-4" />
            <span className="sr-only">Tải lên</span>
          </Button>
          <Button
            type="button"
            size="icon"
            onClick={() => void handleUpload()}
            disabled={!selectedFile || isUploading}
            className="h-6 w-6 rounded-[6px]"
            title="Lưu"
            aria-label="Lưu"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="sr-only">Lưu</span>
          </Button>
        </div>
      </div>

      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          setSelectedFile(event.target.files?.[0] ?? null);
          setErrorMessage("");
        }}
      />

      {showMeta ? (
        <div
          className={cn(
            cmsInsetClass,
            "px-3 py-3",
            hasPreview
              ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              : "space-y-2.5",
          )}
        >
          {hasPreview ? (
            resourceType === "image" ? (
              <div className="shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <img
                  src={previewSrc}
                  alt="Cloudinary preview"
                  className="h-20 w-20 object-cover sm:h-24 sm:w-24"
                />
              </div>
            ) : (
              <div className="shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <video
                  src={previewSrc}
                  controls
                  muted
                  playsInline
                  className="h-20 w-32 bg-slate-950 object-contain sm:h-24 sm:w-40"
                />
              </div>
            )
          ) : null}
          <div className="min-w-0 flex-1 space-y-2">
            {selectedFile ? (
              <div className="flex min-w-0 items-center gap-2">
                <Upload className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="min-w-0 truncate text-xs text-slate-500">
                  {fileLabel}
                </span>
              </div>
            ) : null}

            {errorMessage ? (
              <p className="text-xs text-rose-600">{errorMessage}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
