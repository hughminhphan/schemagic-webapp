export default function Hero() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 pt-[96px] pb-[96px]">
        <h1 className="text-5xl font-bold tracking-tight leading-[48px] md:text-[72px] md:leading-[96px] h-[96px] md:h-[192px]">
          Datasheet in.
          <br />
          <span className="text-accent">Symbol out.</span>
        </h1>
        <p className="mt-[48px] max-w-xl text-lg text-text-secondary leading-[24px] h-[96px]">
          scheMAGIC generates KiCad symbols and footprints from any
          manufacturer&apos;s datasheet. Enter a part number, get a
          production-ready component.
        </p>
        <div className="mt-[48px]">
          <a
            href="https://github.com/hughminhphan/schemagic-webapp/releases/download/v0.1.0/scheMAGIC.dmg"
            download
            className="inline-flex items-center justify-center bg-accent h-[48px] w-[240px] text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          >
            Download for KiCad 8
          </a>
        </div>

        {/* Pipeline visual - each box is exactly 6x2 grid cells (288x96px) */}
        <div className="mt-[96px] flex flex-col gap-[48px] md:flex-row md:gap-0 md:items-center md:justify-center">
          <div className="border border-border w-[288px] h-[96px] p-[24px] flex flex-col justify-center">
            <p className="font-mono text-xs text-text-secondary uppercase tracking-wider">
              Input
            </p>
            <p className="mt-2 text-sm font-medium">datasheet.pdf</p>
          </div>
          <span className="hidden md:flex items-center justify-center w-[96px] font-mono text-text-secondary">
            &rarr;
          </span>
          <div className="border border-accent/40 w-[288px] h-[96px] p-[24px] flex flex-col justify-center">
            <p className="font-mono text-xs text-accent uppercase tracking-wider">
              Process
            </p>
            <p className="mt-2 text-sm font-medium">scheMAGIC</p>
          </div>
          <span className="hidden md:flex items-center justify-center w-[96px] font-mono text-text-secondary">
            &rarr;
          </span>
          <div className="border border-border w-[288px] h-[96px] p-[24px] flex flex-col justify-center">
            <p className="font-mono text-xs text-text-secondary uppercase tracking-wider">
              Output
            </p>
            <p className="mt-2 text-sm font-medium">.kicad_sym + .pretty</p>
          </div>
        </div>
      </div>
    </section>
  );
}
