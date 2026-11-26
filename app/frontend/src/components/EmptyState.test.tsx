import { render, screen } from "@testing-library/react";
import EmptyState from "./EmptyState";

describe("EmptyState", () => {
  it("in a card, says the list is empty beside the inbox icon and offers the way on", () => {
    const { container } = render(
      <EmptyState card action={{ href: "/jobs", label: "Find open jobs" }}>
        You have not applied to any job yet.
      </EmptyState>,
    );

    expect(screen.getByText(/You have not applied to any job yet\./)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Find open jobs" })).toHaveAttribute("href", "/jobs");
    expect(container.querySelector("svg[aria-hidden='true']")).toBeInTheDocument();
  });

  it("without a card, is a plain line with no icon", () => {
    const { container } = render(<EmptyState>No applications yet.</EmptyState>);

    expect(screen.getByText("No applications yet.")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeNull();
  });
});
