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
import { saveSession } from "@/lib/storage";
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
  const [progress, setProgress] = useState<number>(0);
  const [progressStage, setProgressStage] = useState<string>("");
  const [dragCounter, setDragCounter] = useState(0);

  const isUploading = state === "uploading";

  async function handleFile(file: File | null) {
    if (!file || isUploading) {
      return;
    }

    setState("uploading");
    setErrorMessage("");
    setFileName(file.name);
    setProgress(0);
    setProgressStage("Reading portfolio statement...");

    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      // Random increment between 2 and 10
      currentProgress += Math.random() * 8 + 2;
      if (currentProgress >= 95) {
        currentProgress = 95;
        clearInterval(progressInterval);
      }
      setProgress(Math.floor(currentProgress));

      if (currentProgress < 25) {
        setProgressStage("Reading portfolio statement...");
      } else if (currentProgress < 50) {
        setProgressStage("Extracting transaction ledger...");
      } else if (currentProgress < 75) {
        setProgressStage("Analyzing holdings & performance...");
      } else {
        setProgressStage("Matching tickers with NSE master data...");
      }
    }, 150);

    try {
      const data = await ingestPDF(file);
      saveSession(data);

      clearInterval(progressInterval);
      setProgressStage("Finalizing dashboard layout...");

      // Rapid transition from current progress to 100%
      let finalProgress = currentProgress;
      const finalInterval = setInterval(() => {
        finalProgress += 10;
        if (finalProgress >= 100) {
          finalProgress = 100;
          setProgress(100);
          setProgressStage("Analysis complete!");
          clearInterval(finalInterval);

          setTimeout(() => {
            setState("success");
            onSuccess(data);
          }, 600);
        } else {
          setProgress(Math.floor(finalProgress));
        }
      }, 80);
    } catch (error) {
      clearInterval(progressInterval);
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
          ? "0 0 0 1px rgba(99,91,255,0.42), 0 18px 48px rgba(99,91,255,0.16)"
          : "0 0 0 1px rgba(99,91,255,0.18)",
      }}
      style={{ willChange: "transform" }}
      className={cn(
        "relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border bg-[#f6f9fc] px-6 py-8 text-center transition-colors [transform:perspective(900px)]",
        state === "idle" && "border-dashed border-[#635bff]/45",
        isDragging && "border-solid bg-[#635bff]/[0.04]",
        state === "uploading" && "cursor-not-allowed border-[#635bff]/45 bg-[#635bff]/[0.04]",
        state === "success" && "border-emerald-500/45 bg-emerald-50",
        state === "error" && "border-red-500/45 bg-red-50"
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
            className="flex flex-col items-center gap-6 w-full max-w-xs mx-auto"
            exit={{ opacity: 0, y: 8 }}
            initial={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative flex size-16 items-center justify-center rounded-full border border-[#635bff]/25 bg-[#635bff]/10">
              <span className="absolute inset-0 rounded-full border border-[#635bff]/35 animate-pulse" />
              <Loader2 className="size-7 animate-spin text-[#635bff]" aria-hidden />
            </div>
            
            <div className="w-full space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#635bff] animate-pulse">{progressStage}</span>
                <span className="text-muted">{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/50">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#635bff] to-[#8c85ff] shadow-[0_0_8px_rgba(99,91,255,0.4)]"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeInOut", duration: 0.15 }}
                />
              </div>
              <p className="text-[11px] text-muted truncate">
                Processing {fileName || "your file"}
              </p>
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
              className="flex size-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
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
            <div className="flex size-16 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-600">
              <AlertCircle className="size-8" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Upload failed</p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-red-600">{errorMessage}</p>
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
              className="flex size-16 items-center justify-center rounded-full border border-[#635bff]/30 bg-[#635bff]/10 text-[#635bff]"
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
            <div className="flex size-16 items-center justify-center rounded-full border border-[#635bff]/20 bg-[#635bff]/10 text-[#635bff]">
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
