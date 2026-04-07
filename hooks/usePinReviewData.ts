import { useEffect, useRef, useState } from "react";
import type { MatchResult } from "@/components/app/WizardProvider";
import type { LibraryItemPayload } from "@/lib/kicad-render-types";

async function fetchLibraryItem(
  kind: string,
  lib: string,
  name: string,
): Promise<LibraryItemPayload | null> {
  try {
    const params = new URLSearchParams({ kind, lib, name });
    const res = await fetch(`/api/library-item?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.found ? data : null;
  } catch {
    return null;
  }
}

export function usePinReviewData(match: MatchResult | null) {
  const [symbolData, setSymbolData] = useState<LibraryItemPayload | null>(null);
  const [footprintData, setFootprintData] = useState<LibraryItemPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastKey = useRef("");

  useEffect(() => {
    if (!match) {
      setSymbolData(null);
      setFootprintData(null);
      return;
    }

    const key = `${match.symbol_lib}/${match.symbol_name}|${match.footprint_lib}/${match.footprint_name}`;
    if (key === lastKey.current) return;
    lastKey.current = key;

    setLoading(true);
    setError(null);

    const promises: [Promise<LibraryItemPayload | null>, Promise<LibraryItemPayload | null>] = [
      match.symbol_name
        ? fetchLibraryItem("symbol", match.symbol_lib, match.symbol_name)
        : Promise.resolve(null),
      match.footprint_name
        ? fetchLibraryItem("footprint", match.footprint_lib, match.footprint_name)
        : Promise.resolve(null),
    ];

    Promise.all(promises)
      .then(([sym, fp]) => {
        setSymbolData(sym);
        setFootprintData(fp);
      })
      .catch(() => setError("Failed to load library data"))
      .finally(() => setLoading(false));
  }, [match]);

  return { symbolData, footprintData, loading, error };
}
