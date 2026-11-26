import { render, screen } from "@testing-library/react";
import Loading from "./Loading";

describe("Loading", () => {
  it("says what is loading, for screen readers too", () => {
    render(<Loading label="Loading postings…" />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading postings…");
  });

  it("draws one placeholder card per row", () => {
    const { container } = render(<Loading rows={2} />);

    expect(container.querySelectorAll(".card")).toHaveLength(2);
  });
});
