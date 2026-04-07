"use client";

import { useEffect, useRef } from "react";
import { useWizard } from "./WizardProvider";

export default function StatusStream() {
  const { logs, step } = useWizard();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <div className="mt-[48px] border border-border bg-surface-raised p-[24px] max-h-[288px] overflow-y-auto">
      <div className="space-y-1">
        {logs.map((log, i) => (
          <p key={i} className="font-mono text-xs text-text-secondary">
            <span className="text-accent mr-2">&gt;</span>
            {log}
          </p>
        ))}
        {step === "RUNNING" && (
          <p className="font-mono text-xs text-text-secondary animate-pulse">
            <span className="text-accent mr-2">&gt;</span>
            ...
          </p>
        )}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
