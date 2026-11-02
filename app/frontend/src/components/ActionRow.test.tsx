import { render, screen } from "@testing-library/react";
import ActionRow from "./ActionRow";

function renderRow(primary?: boolean) {
  return render(
    <ul>
      <ActionRow
        title="My applications"
        description="Follow your applications."
        href="/applications"
        action="Open applications"
        primary={primary}
      />
    </ul>,
  );
}

describe("ActionRow", () => {
  it("names the action, says what it is for and links to it", () => {
    renderRow();

    expect(screen.getByText("My applications")).toBeInTheDocument();
    expect(screen.getByText("Follow your applications.")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Open applications" });
    expect(link).toHaveAttribute("href", "/applications");
    expect(link).not.toHaveClass("btn-primary");
  });

  it("draws the main action as the primary button", () => {
    renderRow(true);

    expect(screen.getByRole("link", { name: "Open applications" })).toHaveClass("btn", "btn-primary");
  });
});
