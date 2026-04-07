"use client";

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from "react";

export type Step =
  | "IDLE"
  | "RUNNING"
  | "PACKAGE_SELECT"
  | "PIN_REVIEW"
  | "GENERATING"
  | "DONE"
  | "ERROR";

export interface PinInfo {
  number: string;
  name: string;
  pin_type: string;
  description: string;
  alt_numbers: string[];
}

export interface PackageCandidate {
  name: string;
  pin_count: number;
  ti_code: string;
}

export interface MatchResult {
  symbol_lib: string;
  symbol_name: string;
  footprint_lib: string;
  footprint_name: string;
  symbol_score: number;
  footprint_score: number;
  pin_mapping: Record<string, string>;
}

export interface DatasheetSummary {
  part_number: string;
  manufacturer: string;
  description: string;
  component_type: string;
  package: PackageCandidate | null;
  datasheet_url: string;
  confidence: number;
  pins: PinInfo[];
}

export interface FileInfo {
  filename: string;
  size_bytes: number;
}

export interface WizardState {
  step: Step;
  jobId: string;
  partNumber: string;
  candidates: PackageCandidate[];
  datasheet: DatasheetSummary | null;
  match: MatchResult | null;
  pins: PinInfo[];
  files: FileInfo[];
  error: string;
  logs: string[];
}

export type WizardAction =
  | { type: "START_RUN"; jobId: string; partNumber: string }
  | { type: "ADD_LOG"; message: string }
  | { type: "PACKAGE_SELECT"; candidates: PackageCandidate[] }
  | {
      type: "COMPLETE";
      datasheet: DatasheetSummary;
      match: MatchResult;
      pins: PinInfo[];
    }
  | { type: "UPDATE_PIN"; index: number; field: string; value: string }
  | { type: "START_GENERATE" }
  | { type: "GENERATED"; files: FileInfo[] }
  | { type: "ERROR"; message: string }
  | { type: "RESET" };

const initialState: WizardState = {
  step: "IDLE",
  jobId: "",
  partNumber: "",
  candidates: [],
  datasheet: null,
  match: null,
  pins: [],
  files: [],
  error: "",
  logs: [],
};

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "START_RUN":
      return {
        ...initialState,
        step: "RUNNING",
        jobId: action.jobId,
        partNumber: action.partNumber,
      };
    case "ADD_LOG":
      return { ...state, logs: [...state.logs, action.message] };
    case "PACKAGE_SELECT":
      return { ...state, step: "PACKAGE_SELECT", candidates: action.candidates };
    case "COMPLETE":
      return {
        ...state,
        step: "PIN_REVIEW",
        datasheet: action.datasheet,
        match: action.match,
        pins: action.pins,
      };
    case "UPDATE_PIN": {
      const pins = [...state.pins];
      pins[action.index] = { ...pins[action.index], [action.field]: action.value };
      return { ...state, pins };
    }
    case "START_GENERATE":
      return { ...state, step: "GENERATING" };
    case "GENERATED":
      return { ...state, step: "DONE", files: action.files };
    case "ERROR":
      return { ...state, step: "ERROR", error: action.message };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const WizardContext = createContext<WizardState>(initialState);
const WizardDispatchContext = createContext<Dispatch<WizardAction>>(() => {});

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <WizardContext.Provider value={state}>
      <WizardDispatchContext.Provider value={dispatch}>
        {children}
      </WizardDispatchContext.Provider>
    </WizardContext.Provider>
  );
}

export function useWizard() {
  return useContext(WizardContext);
}

export function useWizardDispatch() {
  return useContext(WizardDispatchContext);
}
