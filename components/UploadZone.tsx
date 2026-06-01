"use client";

import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { ingestPDF } from "@/lib/api";
import type { MasterParsedPayload } from "@/lib/types";
import { loadMode, saveSession } from "@/lib/storage";
import { cn } from "@/lib/utils";

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

type UploadZoneProps = {
  onSuccess: (data: MasterParsedPayload) => void;
};

export default function UploadZone({ onSuccess }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [dragCounter, setDragCounter] = useState(0);

  const isUploading = state === "uploading";

  async function handleFile(file: File | null) {
    if (!file || isUploading) {
      return;
    }

    setState("uploading");
    setErrorMessage("");
    setFileName(file.name);

    try {
      const mode = loadMode();
      const data = await ingestPDF(file, mode);
      saveSession(data);
      setState("success");
      onSuccess(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      setErrorMessage(message);
      setState("error");
    }
  }

  function openFilePicker() {
    if (isUploading) {
      return;
    }

    inputRef.current?.click();
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (isUploading) {
      return;
    }

    setDragCounter((current) => current + 1);
    setState("dragging");
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (isUploading) {
      return;
    }

    event.dataTransfer.dropEffect = "copy";
    setState("dragging");
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (isUploading) {
      return;
    }

    setDragCounter((current) => {
      const nextCounter = Math.max(0, current - 1);

      if (nextCounter === 0 && state === "dragging") {
        setState("idle");
      }

      return nextCounter;
    });
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (isUploading) {
      return;
    }

    setDragCounter(0);
    setState("idle");

    const droppedFile = event.dataTransfer.files?.[0] ?? null;
    void handleFile(droppedFile);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;

    void handleFile(selectedFile);
    event.target.value = "";
  }

  const isDragging = state === "dragging" && dragCounter > 0;

  return (
    <motion.section
      animate={{
        scale: isDragging ? 1.02 : 1,
        y: isDragging ? -2 : 0,
        boxShadow: isDragging
          ? "0 0 0 1px rgba(124,58,237,0.5), 0 0 32px rgba(124,58,237,0.22)"
          : "0 0 0 1px rgba(124,58,237,0.2)",
      }}
      className={cn(
        "relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border bg-[#111118] px-6 py-8 text-center transition-colors",
        state === "idle" && "border-dashed border-[#7c3aed]",
        isDragging && "border-solid bg-[#171724]",
        state === "uploading" && "cursor-not-allowed border-[#7c3aed]/55 bg-[#141420]",
        state === "success" && "border-emerald-500/55 bg-emerald-500/[0.04]",
        state === "error" && "border-red-500/70 bg-red-500/[0.04]"
      )}
      onClick={openFilePicker}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      <input
        accept="application/pdf"
        className="sr-only"
        disabled={isUploading}
        onChange={handleInputChange}
        ref={inputRef}
        type="file"
      />

      <AnimatePresence mode="wait" initial={false}>
        {state === "uploading" ? (
          <motion.div
            key="uploading"
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4"
            exit={{ opacity: 0, y: 8 }}
            initial={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative flex size-16 items-center justify-center rounded-full border border-[#7c3aed]/30 bg-[#7c3aed]/10">
              <span className="absolute inset-0 rounded-full border border-[#7c3aed]/40 animate-pulse" />
              <Loader2 className="size-7 animate-spin text-[#c4b5fd]" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Uploading statement</p>
              <p className="mt-1 text-xs text-muted">Processing {fileName || "your file"}...</p>
            </div>
          </motion.div>
        ) : state === "success" ? (
          <motion.div
            key="success"
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
            exit={{ opacity: 0, scale: 0.96 }}
            initial={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22 }}
          >
            <motion.div
              animate={{ scale: [0.88, 1.08, 1] }}
              className="flex size-16 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
              transition={{ duration: 0.45 }}
            >
              <CheckCircle2 className="size-8" aria-hidden />
            </motion.div>
            <div>
              <p className="text-sm font-medium text-foreground">Upload complete</p>
              <p className="mt-1 text-xs text-muted">{fileName}</p>
            </div>
          </motion.div>
        ) : state === "error" ? (
          <motion.div
            key="error"
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4"
            exit={{ opacity: 0, y: 8 }}
            initial={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex size-16 items-center justify-center rounded-full border border-red-400/40 bg-red-500/10 text-red-300">
              <AlertCircle className="size-8" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Upload failed</p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-red-200">{errorMessage}</p>
            </div>
          </motion.div>
        ) : isDragging ? (
          <motion.div
            key="dragging"
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4"
            exit={{ opacity: 0, y: 8 }}
            initial={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="flex size-16 items-center justify-center rounded-full border border-[#7c3aed]/35 bg-[#7c3aed]/12 text-[#c4b5fd]"
            >
              <UploadCloud className="size-8" aria-hidden />
            </motion.div>
            <div>
              <p className="text-sm font-medium text-foreground">Release to upload</p>
              <p className="mt-1 text-xs text-muted">Drop the broker statement PDF here</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4"
            exit={{ opacity: 0, y: 8 }}
            initial={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex size-16 items-center justify-center rounded-full border border-[#7c3aed]/20 bg-[#7c3aed]/10 text-[#c4b5fd]">
              <UploadCloud className="size-8" aria-hidden />
            </div>
            <div>
              <p className="text-base font-medium text-foreground">
                Drop your broker statement here
              </p>
              <p className="mt-1 text-sm text-muted">
                or click to choose a PDF from your device
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}