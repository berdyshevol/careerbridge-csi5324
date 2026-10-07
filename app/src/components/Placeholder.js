// Stub screen for a use case that is not implemented yet.
// The use case owner replaces the page that renders this.
export default function Placeholder({ useCase, owner }) {
  return (
    <section>
      <h1>{useCase}</h1>
      <p className="muted">Not implemented yet. Owner: {owner}.</p>
    </section>
  );
}
