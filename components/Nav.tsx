export default function Nav() {
  return (
    <nav className="border-b border-border">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-[48px]">
        <span className="font-mono text-sm font-medium tracking-wider">
          sche<span className="text-accent">MAGIC</span>
        </span>
        <div className="flex items-center gap-[24px]">
          <a
            href="#download"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Download
          </a>
          <a
            href="/app"
            className="inline-flex items-center justify-center bg-accent h-[32px] px-[16px] text-xs font-medium text-white hover:bg-accent-hover transition-colors"
          >
            Launch App
          </a>
        </div>
      </div>
    </nav>
  );
}
