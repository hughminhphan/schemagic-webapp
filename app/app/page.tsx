"use client";

import Nav from "@/components/Nav";
import { WizardProvider, useWizard } from "@/components/app/WizardProvider";
import PartInput from "@/components/app/PartInput";
import StatusStream from "@/components/app/StatusStream";
import PackageSelect from "@/components/app/PackageSelect";
import PinReviewTable from "@/components/app/PinReviewTable";
import DownloadPanel from "@/components/app/DownloadPanel";

function WizardRouter() {
  const state = useWizard();

  return (
    <>
      <div className="mb-[48px]">
        <h1 className="text-3xl font-bold tracking-tight">
          sche<span className="text-accent">MAGIC</span>
        </h1>
        <p className="mt-[12px] text-sm text-text-secondary">
          Enter a part number to generate KiCad symbols and footprints.
        </p>
      </div>

      <PartInput />
      <StatusStream />

      {state.step === "PACKAGE_SELECT" && <PackageSelect />}

      {(state.step === "PIN_REVIEW" || state.step === "GENERATING") && (
        <PinReviewTable />
      )}

      {state.step === "GENERATING" && (
        <div className="mt-[24px] border border-border bg-surface-raised p-[24px]">
          <p className="font-mono text-xs text-text-secondary animate-pulse">
            Generating files...
          </p>
        </div>
      )}

      {state.step === "DONE" && <DownloadPanel />}

      {state.step === "ERROR" && (
        <div className="mt-[48px] border border-accent/30 bg-surface-raised p-[24px]">
          <p className="font-mono text-xs text-accent uppercase tracking-wider mb-[12px]">
            Error
          </p>
          <p className="text-sm text-text-secondary">{state.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-[24px] border border-border h-[48px] px-[24px] text-sm text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
          >
            Try again
          </button>
        </div>
      )}
    </>
  );
}

export default function AppPage() {
  return (
    <WizardProvider>
      <div className="grid-bg min-h-screen">
        <Nav />
        <main className="mx-auto max-w-6xl px-6 py-[96px]">
          <WizardRouter />
        </main>
      </div>
    </WizardProvider>
  );
}
