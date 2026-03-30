const steps = [
  {
    number: "01",
    title: "Enter a part number",
    description:
      "Type any manufacturer part number. scheMAGIC fetches the datasheet automatically.",
  },
  {
    number: "02",
    title: "Datasheet parsed",
    description:
      "LLM-assisted extraction reads pin tables, package info, and electrical specs from the PDF.",
  },
  {
    number: "03",
    title: "Symbol generated",
    description:
      "A complete KiCad symbol and footprint land in your project. Review pins before saving.",
  },
];

export default function HowItWorks() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-[96px]">
        <h2 className="font-mono text-xs text-text-secondary uppercase tracking-wider">
          How it works
        </h2>
        <div className="mt-[48px] grid gap-px bg-border md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="bg-surface p-[48px]">
              <span className="font-mono text-xs text-accent">
                {step.number}
              </span>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
