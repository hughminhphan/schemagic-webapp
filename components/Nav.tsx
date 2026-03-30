export default function Nav() {
  return (
    <nav className="border-b border-border">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-[48px]">
        <span className="font-mono text-sm font-medium tracking-wider">
          sche<span className="text-accent">MAGIC</span>
        </span>
        <a
          href="#download"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Download
        </a>
      </div>
    </nav>
  );
}
