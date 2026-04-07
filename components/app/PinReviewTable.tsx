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
  const { pins } = useWizard();
  const dispatch = useWizardDispatch();

  if (pins.length === 0) return null;

  return (
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
  );
}
