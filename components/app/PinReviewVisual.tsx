"use client";

import { useMemo, useState } from "react";
import { useWizard, useWizardDispatch } from "./WizardProvider";
import { usePinReviewData } from "@/hooks/usePinReviewData";
import { generateSyntheticSymbol } from "@/lib/generate-synthetic-symbol";
import SymbolViewer from "./SymbolViewer";
import FootprintViewer from "./FootprintViewer";
import PinEditPanel from "./PinEditPanel";
import PinReviewTable from "./PinReviewTable";

export default function PinReviewVisual() {
  const { pins, match, datasheet, jobId, selectedPinNumber } = useWizard();
  const dispatch = useWizardDispatch();
  const { symbolData, footprintData, loading } = usePinReviewData(match);
  const [showTable, setShowTable] = useState(false);

  // Fall back to synthetic symbol when no library match
  const effectiveSymbolData = symbolData ?? generateSyntheticSymbol(pins);

  // Resolve "EP" pin number to actual footprint pad number.
  // The extractor uses "EP" for thermal/exposed pads, but footprints use a
  // real pad number (e.g. "25" on a 24-pin package).
  const epPadNumber = useMemo(() => {
    if (!footprintData?.pads) return null;
    // Thermal pad is typically the largest pad by area
    let largest: { number: string; area: number } | null = null;
    for (const pad of footprintData.pads) {
      if (!pad.number) continue;
      const area = pad.size[0] * pad.size[1];
      if (!largest || area > largest.area) {
        largest = { number: pad.number, area };
      }
    }
    // Only treat as EP if it's significantly larger than the median pad
    if (!largest) return null;
    const areas = footprintData.pads
      .filter((p) => p.number)
      .map((p) => p.size[0] * p.size[1])
      .sort((a, b) => a - b);
    const median = areas[Math.floor(areas.length / 2)] || 1;
    return largest.area > median * 3 ? largest.number : null;
  }, [footprintData]);

  // Group same-name pins: all pin numbers sharing a name map to the first pin's number.
  // This extends the alt_numbers logic to non-power pins (e.g. OUT1 on pads 2,3,4).
  const { padToPinMap, highlightedPads } = useMemo(() => {
    // Build name groups: name -> [pin numbers]
    const nameGroups = new Map<string, string[]>();
    for (const pin of pins) {
      const key = pin.name.toUpperCase();
      const group = nameGroups.get(key);
      if (group) {
        group.push(pin.number);
      } else {
        nameGroups.set(key, [pin.number]);
      }
    }

    // Map every pad number to its group's primary pin number
    const map = new Map<string, string>();
    for (const pin of pins) {
      const key = pin.name.toUpperCase();
      const group = nameGroups.get(key)!;
      const primary = group[0];
      map.set(pin.number, primary);
      for (const alt of pin.alt_numbers) {
        if (alt === "EP" && epPadNumber) {
          map.set(epPadNumber, primary);
        } else {
          map.set(alt, primary);
        }
      }
    }
    // Also map "EP" primary pin number
    const epPin = pins.find((p) => p.number === "EP");
    if (epPin && epPadNumber) {
      const key = epPin.name.toUpperCase();
      const group = nameGroups.get(key);
      map.set(epPadNumber, group ? group[0] : epPin.number);
    }

    // Compute highlighted pads: all pad numbers in the selected pin's name group
    const highlighted = new Set<string>();
    if (selectedPinNumber) {
      const selectedPin = pins.find((p) => p.number === selectedPinNumber);
      if (selectedPin) {
        const key = selectedPin.name.toUpperCase();
        const group = nameGroups.get(key) || [selectedPin.number];
        // Add all pin numbers in the group
        for (const num of group) {
          highlighted.add(num);
          // Also add alt_numbers for each pin in the group
          const p = pins.find((pp) => pp.number === num);
          if (p) {
            for (const alt of p.alt_numbers) {
              if (alt === "EP" && epPadNumber) {
                highlighted.add(epPadNumber);
              } else {
                highlighted.add(alt);
              }
            }
          }
        }
      }
    }

    return { padToPinMap: map, highlightedPads: highlighted };
  }, [pins, selectedPinNumber, epPadNumber]);

  function handlePinSelect(pinNumber: string) {
    dispatch({
      type: "SELECT_PIN",
      pinNumber: selectedPinNumber === pinNumber ? null : pinNumber,
    });
  }

  function handlePadSelect(padNumber: string) {
    // Resolve pad number to its parent pin's primary number
    const primaryPin = padToPinMap.get(padNumber) ?? padNumber;
    dispatch({
      type: "SELECT_PIN",
      pinNumber: selectedPinNumber === primaryPin ? null : primaryPin,
    });
  }

  async function handleGenerate() {
    dispatch({ type: "START_GENERATE" });

    try {
      const res = await fetch("/api/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId, pins }),
      });
      const data = await res.json();
      dispatch({
        type: "GENERATED",
        files: data.files,
        model: data.model || null,
      });
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
        <div className="mb-[24px] border border-border bg-surface-raised p-[16px]">
          <p className="font-mono text-xs text-text-secondary">
            No library match - showing generated layout from datasheet pins
          </p>
        </div>
      )}

      {/* Visual renderers */}
      {loading ? (
        <div className="grid grid-cols-2 gap-[16px] mb-[16px]">
          <div className="border border-border bg-surface-raised h-[400px] animate-pulse" />
          <div className="border border-border bg-surface-raised h-[400px] animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-[16px] mb-[16px]">
          <SymbolViewer
            data={effectiveSymbolData}
            selectedPinNumber={selectedPinNumber}
            onPinClick={handlePinSelect}
          />
          <FootprintViewer
            data={footprintData}
            highlightedPads={highlightedPads}
            onPadClick={handlePadSelect}
          />
        </div>
      )}

      {/* Pin edit panel */}
      <div className="mb-[16px]">
        <PinEditPanel />
      </div>

      {/* Expandable pin table */}
      <div className="mb-[24px]">
        <button
          onClick={() => setShowTable(!showTable)}
          className="font-mono text-xs text-text-secondary uppercase tracking-wider hover:text-text-primary transition-colors"
        >
          {showTable ? "Hide" : "Show"} all pins ({pins.length})
        </button>
        {showTable && (
          <div className="mt-[12px]">
            <PinReviewTable />
          </div>
        )}
      </div>

      <button
        onClick={handleGenerate}
        className="w-full bg-accent h-[48px] text-sm font-medium text-white hover:bg-accent-hover transition-colors"
      >
        Generate Files
      </button>
    </div>
  );
}
