"use client";

import { useState, useRef, type FormEvent, type DragEvent } from "react";
import { useWizard, useWizardDispatch } from "./WizardProvider";

export default function PartInput() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const state = useWizard();
  const dispatch = useWizardDispatch();

  const isRunning = state.step === "RUNNING";

  function handleFile(f: File) {
    if (f.type !== "application/pdf") {
      dispatch({ type: "ERROR", message: "Only PDF files are accepted" });
      return;
    }
    setFile(f);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("datasheet", file);

      const res = await fetch("/api/run", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const text = await res.text();
        let detail = `Server error (${res.status})`;
        try {
          const errJson = JSON.parse(text);
          detail = errJson.detail || detail;
        } catch {
          if (text) detail = text;
        }
        throw new Error(detail);
      }
      const data = await res.json();
      const jobId = data.job_id;

      dispatch({ type: "START_RUN", jobId, partNumber: file.name.replace(/\.pdf$/i, "") });

      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const sseRes = await fetch(`${apiBase}/api/status/${jobId}`);
      if (!sseRes.ok || !sseRes.body) {
        dispatch({ type: "ERROR", message: "Failed to connect to status stream" });
        return;
      }

      const reader = sseRes.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let currentEvent = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop()!;

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const d = JSON.parse(line.slice(6));
            switch (currentEvent) {
              case "status":
                dispatch({ type: "ADD_LOG", message: d.message });
                break;
              case "package_select":
                dispatch({ type: "PACKAGE_SELECT", candidates: d.candidates });
                return;
              case "complete":
                dispatch({ type: "COMPLETE", datasheet: d.datasheet, match: d.match, pins: d.pins });
                return;
              case "error":
                dispatch({ type: "ERROR", message: d.message });
                return;
            }
            currentEvent = "";
          }
        }
      }
    } catch (err) {
      dispatch({
        type: "ERROR",
        message: err instanceof Error ? err.message : "Failed to start pipeline",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isRunning && fileInputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center
          border-2 border-dashed rounded-lg px-6 py-8
          cursor-pointer transition-colors
          ${isDragging
            ? "border-accent bg-accent/5"
            : file
              ? "border-accent/50 bg-surface-raised"
              : "border-border bg-surface-raised hover:border-text-secondary"
          }
          ${isRunning ? "opacity-40 pointer-events-none" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="hidden"
          disabled={isRunning}
        />

        {file ? (
          <>
            <svg className="w-8 h-8 text-accent mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <span className="text-sm font-medium text-text-primary">{file.name}</span>
            <span className="text-xs text-text-secondary mt-1">
              {(file.size / 1024).toFixed(0)} KB
            </span>
          </>
        ) : (
          <>
            <svg className="w-8 h-8 text-text-secondary mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-sm font-medium text-text-primary">
              Drop datasheet PDF here
            </span>
            <span className="text-xs text-text-secondary mt-1">
              or click to browse
            </span>
          </>
        )}
      </div>

      <button
        type="submit"
        disabled={isRunning || !file}
        className="bg-accent h-[48px] px-[24px] text-sm font-medium text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-40"
      >
        {isRunning ? "Running..." : "Generate"}
      </button>
    </form>
  );
}
