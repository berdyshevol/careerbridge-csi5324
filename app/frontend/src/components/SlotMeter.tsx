export default function SlotMeter({
  used,
  total,
  caption,
  compact = false,
  className = "",
}: {
  used: number;
  total: number;
  caption?: string;
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <section className={`rounded-2xl border border-base-300 bg-base-100 p-4 ${className}`}>
        <p className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-semibold leading-none">{used}</span>
          <span className="text-sm text-muted">of {total} active</span>
        </p>
      </section>
    );
  }
  const slots = Array.from({ length: total }, (_, index) => index < used);
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-5">
      <h2 className="font-semibold">Application slots</h2>
      <p className="flex items-baseline gap-2">
        <span className="font-display text-4xl font-semibold leading-none">{used}</span>
        <span className="text-muted">of {total} in use</span>
      </p>
      <div role="img" aria-label={`${used} of ${total} slots in use`} className="flex gap-1.5">
        {slots.map((isUsed, index) => (
          <span
            key={index}
            data-used={isUsed}
            className={`h-2.5 grow rounded-full ${isUsed ? "bg-primary" : "bg-base-300"}`}
          />
        ))}
      </div>
      {caption && <p className="text-sm text-muted">{caption}</p>}
    </section>
  );
}
