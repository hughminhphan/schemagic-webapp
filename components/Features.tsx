const features = [
  {
    title: "Any manufacturer",
    description:
      "LLM-powered parsing works across TI, ADI, and thousands more. No per-manufacturer setup required.",
  },
  {
    title: "Project-local",
    description:
      "Symbols and footprints save to your project directory. No global library pollution.",
  },
  {
    title: "Pin review",
    description:
      "Colour-coded pin editor lets you verify and adjust every pin before committing to your schematic.",
  },
];

export default function Features() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-[96px]">
        <h2 className="font-mono text-xs text-text-secondary uppercase tracking-wider">
          Features
        </h2>
        <div className="mt-[48px] grid gap-[48px] md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title}>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
