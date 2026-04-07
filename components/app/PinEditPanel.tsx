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

export default function PinEditPanel() {
  const { pins, selectedPinNumber } = useWizard();
  const dispatch = useWizardDispatch();

  if (!selectedPinNumber) {
    return (
      <div className="border border-border bg-surface-raised p-[16px]">
        <p className="font-mono text-xs text-text-secondary">
          Click a pin or pad to edit
        </p>
      </div>
    );
  }

  const idx = pins.findIndex((p) => p.number === selectedPinNumber);
  if (idx === -1) {
    return (
      <div className="border border-border bg-surface-raised p-[16px]">
        <p className="font-mono text-xs text-text-secondary">
          Pin {selectedPinNumber} not in extracted data
        </p>
      </div>
    );
  }

  const pin = pins[idx];

  return (
    <div className="border border-border bg-surface-raised p-[16px]">
      <div className="flex items-center gap-[24px]">
        <div className="flex items-center gap-[8px]">
          <span className="font-mono text-xs text-text-secondary uppercase tracking-wider">
            Pin {pin.number}
          </span>
          {pin.alt_numbers.length > 0 && (
            <span className="font-mono text-xs text-text-secondary">
              (+{pin.alt_numbers.join(", ")})
            </span>
          )}
        </div>

        <div className="flex items-center gap-[8px]">
          <label className="font-mono text-xs text-text-secondary uppercase tracking-wider">
            Name
          </label>
          <input
            type="text"
            value={pin.name}
            onChange={(e) =>
              dispatch({
                type: "UPDATE_PIN",
                index: idx,
                field: "name",
                value: e.target.value,
              })
            }
            className="bg-transparent border border-border text-sm h-[32px] px-[8px] text-text-primary focus:outline-none focus:border-accent w-[160px]"
          />
        </div>

        <div className="flex items-center gap-[8px]">
          <label className="font-mono text-xs text-text-secondary uppercase tracking-wider">
            Type
          </label>
          <select
            value={pin.pin_type}
            onChange={(e) =>
              dispatch({
                type: "UPDATE_PIN",
                index: idx,
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
        </div>

        {pin.description && (
          <p className="text-sm text-text-secondary truncate max-w-[300px]">
            {pin.description}
          </p>
        )}

        <button
          onClick={() => dispatch({ type: "SELECT_PIN", pinNumber: null })}
          className="ml-auto font-mono text-xs text-text-secondary hover:text-text-primary"
        >
          Deselect
        </button>
      </div>
    </div>
  );
}
