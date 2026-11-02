// One per screen.
export default function PageTitle({
  eyebrow,
  context,
  children,
  subtitle,
}: {
  eyebrow?: string;
  // A plain line above the title naming what it belongs to, such as a posting's organization
  context?: string;
  children: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <div>
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-wider text-muted">{eyebrow}</p>
      )}
      {context && <p className="text-sm text-muted">{context}</p>}
      <h1 className="mt-1 font-display text-2xl font-semibold md:text-3xl">{children}</h1>
      {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
    </div>
  );
}
