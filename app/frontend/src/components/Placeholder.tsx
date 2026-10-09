// The use case owner replaces the page that renders this.
export default function Placeholder({ useCase, owner }: { useCase: string; owner: string }) {
  return (
    <section className="card border border-base-300 bg-base-100">
      <div className="card-body">
        <h1 className="font-display text-2xl font-semibold">{useCase}</h1>
        <p className="text-muted">Not implemented yet. Owner: {owner}.</p>
      </div>
    </section>
  );
}
