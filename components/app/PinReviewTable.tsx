"use client";

import { useWizard, useWizardDispatch } from "./WizardProvider";

const PIN_TYPES = [
  "input",
  "output",
  "bidirectional",
  "tri_state",
  "passive",
  "free",
  "unspecified",
  "power_in",
  "power_out",
  "open_collector",
  "open_emitter",
  "no_connect",
];

export default function PinReviewTable() {
  const { pins, match, datasheet, jobId } = useWizard();
  const dispatch = useWizardDispatch();

  async function handleGenerate() {
    dispatch({ type: "START_GENERATE" });

    try {
      const res = await fetch("/api/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId, pins }),
      });
      const data = await res.json();
      dispatch({ type: "GENERATED", files: data.files });
    } catch (err) {
      dispatch({
        type: "ERROR",
        message: err instanceof Error ? err.message : "Generation failed",
      });
    }
  }

  if (pins.length === 0) {
    return (
      <div className="mt-[48px] border border-border bg-surface-raised p-[24px]">
        <p className="text-sm text-text-secondary">
          No pins extracted from datasheet. The part may not have been found.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-[48px]">
      {/* Match info */}
      {match && (match.symbol_name || match.footprint_name) && (
        <div className="mb-[24px] flex gap-[48px]">
          {match.symbol_name && (
            <div>
              <p className="font-mono text-xs text-text-secondary uppercase tracking-wider">
                Symbol match
              </p>
              <p className="mt-1 text-sm">
                {match.symbol_lib}/{match.symbol_name}
                <span className="ml-2 font-mono text-xs text-text-secondary">
                  {match.symbol_score.toFixed(0)}%
                </span>
              </p>
            </div>
          )}
          {match.footprint_name && (
            <div>
              <p className="font-mono text-xs text-text-secondary uppercase tracking-wider">
                Footprint match
              </p>
              <p className="mt-1 text-sm">
                {match.footprint_lib}/{match.footprint_name}
                <span className="ml-2 font-mono text-xs text-text-secondary">
                  {match.footprint_score.toFixed(0)}%
                </span>
              </p>
            </div>
          )}
          {datasheet?.package && (
            <div>
              <p className="font-mono text-xs text-text-secondary uppercase tracking-wider">
                Package
              </p>
              <p className="mt-1 text-sm">
                {datasheet.package.name} ({datasheet.package.pin_count} pins)
              </p>
            </div>
          )}
        </div>
      )}

      {!match?.symbol_name && (
        <div className="mb-[24px] border border-border bg-surface-raised p-[24px]">
          <p className="text-sm text-text-secondary">
            No KiCad library match found. Symbol will be generated from scratch.
          </p>
        </div>
      )}

      {/* Pin table */}
      <p className="font-mono text-xs text-text-secondary uppercase tracking-wider mb-[12px]">
        Pin review ({pins.length} pins)
      </p>

      <div className="border border-border max-h-[768px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-surface-raised z-10">
            <tr className="border-b border-border">
              <th className="h-[48px] px-[24px] text-left font-mono text-xs text-text-secondary uppercase tracking-wider w-[80px]">
                Pin
              </th>
              <th className="h-[48px] px-[24px] text-left font-mono text-xs text-text-secondary uppercase tracking-wider">
                Name
              </th>
              <th className="h-[48px] px-[24px] text-left font-mono text-xs text-text-secondary uppercase tracking-wider w-[180px]">
                Type
              </th>
              <th className="h-[48px] px-[24px] text-left font-mono text-xs text-text-secondary uppercase tracking-wider">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {pins.map((pin, i) => (
              <tr key={i} className="border-b border-border hover:bg-surface-raised/50">
                <td className="h-[48px] px-[24px] font-mono text-sm">
                  {pin.number}
                  {pin.alt_numbers.length > 0 && (
                    <span className="text-text-secondary text-xs ml-1">
                      +{pin.alt_numbers.length}
                    </span>
                  )}
                </td>
                <td className="h-[48px] px-[24px]">
                  <input
                    type="text"
                    value={pin.name}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_PIN",
                        index: i,
                        field: "name",
                        value: e.target.value,
                      })
                    }
                    className="bg-transparent text-sm w-full focus:outline-none focus:underline focus:decoration-accent"
                  />
                </td>
                <td className="h-[48px] px-[24px]">
                  <select
                    value={pin.pin_type}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_PIN",
                        index: i,
                        field: "pin_type",
                        value: e.target.value,
                      })
                    }
                    className="bg-surface-raised border border-border text-sm h-[32px] px-2 text-text-primary focus:outline-none focus:border-accent"
                  >
                    {PIN_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="h-[48px] px-[24px] text-sm text-text-secondary truncate max-w-[300px]">
                  {pin.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleGenerate}
        className="mt-[24px] w-full bg-accent h-[48px] text-sm font-medium text-white hover:bg-accent-hover transition-colors"
      >
        Generate Files
      </button>
    </div>
  );
}
