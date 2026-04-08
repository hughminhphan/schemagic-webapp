export default function DownloadCTA() {
  return (
    <section id="download">
      <div className="mx-auto max-w-6xl px-6 py-[96px]">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Get scheMAGIC
          </h2>
          <p className="mt-[24px] text-text-secondary">
            Stop drawing symbols by hand.
          </p>
          <div className="mt-[48px]">
            <a
              href="/scheMAGIC.dmg"
              download
              className="inline-flex items-center justify-center bg-accent h-[48px] w-[240px] text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            >
              Download for KiCad 8
            </a>
          </div>
          <p className="mt-[48px] font-mono text-xs text-text-secondary">
            Requires KiCad 8.0+
          </p>
        </div>
      </div>
    </section>
  );
}
