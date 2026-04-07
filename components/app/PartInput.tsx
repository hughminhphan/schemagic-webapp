"use client";

import { useState, type FormEvent } from "react";
import { useWizard, useWizardDispatch } from "./WizardProvider";

export default function PartInput() {
  const [value, setValue] = useState("");
  const state = useWizard();
  const dispatch = useWizardDispatch();

  const isRunning = state.step === "RUNNING";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const partNumber = value.trim();
    if (!partNumber) return;

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ part_number: partNumber }),
      });
      const data = await res.json();
      const jobId = data.job_id;

      dispatch({ type: "START_RUN", jobId, partNumber });

      // Open SSE connection
      const evtSource = new EventSource(`/api/status/${jobId}`);

      evtSource.addEventListener("status", (e) => {
        const d = JSON.parse(e.data);
        dispatch({ type: "ADD_LOG", message: d.message });
      });

      evtSource.addEventListener("package_select", (e) => {
        const d = JSON.parse(e.data);
        dispatch({ type: "PACKAGE_SELECT", candidates: d.candidates });
        evtSource.close();
      });

      evtSource.addEventListener("complete", (e) => {
        const d = JSON.parse(e.data);
        dispatch({
          type: "COMPLETE",
          datasheet: d.datasheet,
          match: d.match,
          pins: d.pins,
        });
        evtSource.close();
      });

      evtSource.addEventListener("error", (e) => {
        try {
          const d = JSON.parse((e as MessageEvent).data);
          dispatch({ type: "ERROR", message: d.message });
        } catch {
          dispatch({ type: "ERROR", message: "Connection lost" });
        }
        evtSource.close();
      });

      evtSource.onerror = () => {
        evtSource.close();
      };
    } catch (err) {
      dispatch({
        type: "ERROR",
        message: err instanceof Error ? err.message : "Failed to start pipeline",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-[1px] bg-border">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter part number (e.g. TPS54302)"
        disabled={isRunning}
        className="flex-1 border border-border bg-surface-raised h-[48px] px-[24px] text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={isRunning || !value.trim()}
        className="bg-accent h-[48px] px-[24px] text-sm font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-40"
      >
        {isRunning ? "Running..." : "Generate"}
      </button>
    </form>
  );
}
