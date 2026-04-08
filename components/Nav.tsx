"use client";

import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();
  const isLanding = pathname === "/landing";

  return (
    <nav className="border-b border-border">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-[48px]">
        <a href="/" className="font-mono text-sm font-medium tracking-wider hover:opacity-80 transition-opacity">
          sche<span className="text-accent">MAGIC</span>
        </a>
        <div className="flex items-center gap-[24px]">
          {isLanding ? (
            <>
              <a
                href="#download"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Download
              </a>
              <a
                href="/"
                className="inline-flex items-center justify-center bg-accent h-[32px] px-[16px] text-xs font-medium text-white hover:bg-accent-hover transition-colors"
              >
                Launch App
              </a>
            </>
          ) : (
            <a
              href="/landing"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              About
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
