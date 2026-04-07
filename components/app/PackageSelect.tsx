"use client";

import { useWizard, useWizardDispatch } from "./WizardProvider";

export default function PackageSelect() {
  const { candidates, jobId } = useWizard();
  const dispatch = useWizardDispatch();

  async function handleSelect(candidate: (typeof candidates)[0]) {
    dispatch({ type: "ADD_LOG", message: `Selected package: ${candidate.name}` });

    try {
      const res = await fetch("/api/select-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          package: candidate,
        }),
      });
      const data = await res.json();

      dispatch({
        type: "COMPLETE",
        datasheet: data.datasheet,
        match: data.match,
        pins: data.pins,
      });
    } catch (err) {
      dispatch({
        type: "ERROR",
        message: err instanceof Error ? err.message : "Package selection failed",
      });
    }
  }

  if (candidates.length === 0) return null;

  return (
    <div className="mt-[48px]">
      <p className="font-mono text-xs text-text-secondary uppercase tracking-wider mb-[24px]">
        Select package
      </p>
      <div className="flex flex-wrap gap-[1px] bg-border">
        {candidates.map((c, i) => (
          <button
            key={i}
            onClick={() => handleSelect(c)}
            className="border border-border bg-surface w-[288px] h-[96px] p-[24px] flex flex-col justify-center hover:border-accent transition-colors text-left"
          >
            <p className="text-sm font-medium">{c.name}</p>
            <p className="mt-1 font-mono text-xs text-text-secondary">
              {c.pin_count} pins
              {c.ti_code ? ` / ${c.ti_code}` : ""}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
