"use client";

import { useWizard, useWizardDispatch } from "./WizardProvider";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function DownloadPanel() {
  const { files, jobId, partNumber, datasheet } = useWizard();
  const dispatch = useWizardDispatch();

  if (files.length === 0) return null;

  return (
    <div className="mt-[48px]">
      <p className="font-mono text-xs text-text-secondary uppercase tracking-wider mb-[12px]">
        Generated files
      </p>

      <div className="space-y-[1px] bg-border">
        {files.map((f, i) => (
          <a
            key={i}
            href={`/api/download/${jobId}/${f.filename}`}
            download
            className="flex items-center justify-between bg-surface h-[48px] px-[24px] hover:bg-surface-raised transition-colors"
          >
            <span className="font-mono text-sm">{f.filename}</span>
            <span className="flex items-center gap-[12px]">
              <span className="text-xs text-text-secondary">
                {formatBytes(f.size_bytes)}
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-text-secondary"
              >
                <path
                  d="M8 2v8m0 0l-3-3m3 3l3-3M3 13h10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                />
              </svg>
            </span>
          </a>
        ))}
      </div>

      <div className="mt-[48px] flex gap-[24px]">
        <button
          onClick={() => dispatch({ type: "RESET" })}
          className="border border-border h-[48px] px-[24px] text-sm text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
        >
          Generate another
        </button>
      </div>

      {datasheet && (
        <p className="mt-[24px] font-mono text-xs text-text-secondary">
          {datasheet.part_number}
          {datasheet.manufacturer ? ` / ${datasheet.manufacturer}` : ""}
          {datasheet.package ? ` / ${datasheet.package.name}` : ""}
        </p>
      )}
    </div>
  );
}
