// While a page or a list is on its way: gray cards where the content will be, so the page does not
// jump when it arrives. label is read out to screen readers and shown under the cards.
export default function Loading({ label = "Loading…", rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div role="status" className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} aria-hidden="true" className="card border border-base-300 bg-base-100">
          <div className="card-body gap-2.5 p-5">
            <div className="skeleton h-4 w-2/5" />
            <div className="skeleton h-3 w-3/5" />
          </div>
        </div>
      ))}
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
