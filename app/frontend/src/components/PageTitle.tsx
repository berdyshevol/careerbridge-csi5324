// The title of a screen, with an optional line under it and an optional
// eyebrow above it. One per screen.
export default function PageTitle({
  eyebrow,
  children,
  subtitle,
}: {
  eyebrow?: string;
  children: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <div>
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-wider text-muted">{eyebrow}</p>
      )}
      <h1 className="mt-1 font-display text-2xl font-semibold md:text-3xl">{children}</h1>
      {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
    </div>
  );
}
