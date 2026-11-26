import { render, screen } from "@testing-library/react";
import SummaryCards from "./SummaryCards";

describe("SummaryCards", () => {
  it("shows each count as a link to the screen that lists it", () => {
    render(
      <SummaryCards
        items={[
          { label: "Active applications", value: 3, of: 5, href: "/applications" },
          { label: "Offers to answer", value: 1, href: "/applications" },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Active applications: 3 of 5" })).toHaveAttribute("href", "/applications");
    expect(screen.getByRole("link", { name: "Offers to answer: 1" })).toBeInTheDocument();
  });

  it("shows no number when the backend did not answer (ADR-0013)", () => {
    render(<SummaryCards items={[{ label: "Published", value: null, href: "/recruiter/postings" }]} />);

    expect(screen.getByRole("link", { name: "Published: not available" })).toBeInTheDocument();
    expect(screen.queryByText(/\d/)).toBeNull();
  });
});
