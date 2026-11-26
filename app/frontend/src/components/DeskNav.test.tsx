import { render, screen, within } from "@testing-library/react";
import DeskNav from "./DeskNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/jobs",
}));

// The side column, the tiles and the dock repeat the same entries; the side column is enough
function sideColumn() {
  return screen.getAllByRole("navigation", { name: "Navigation" })[0];
}

describe("DeskNav", () => {
  it("gives a visitor no navigation", () => {
    const { container } = render(<DeskNav role={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("gives an applicant only the applicant's entries", () => {
    render(<DeskNav role="APPLICANT" />);
    const links = within(sideColumn()).getAllByRole("link");

    expect(links.map((link) => link.textContent)).toEqual(["Home", "Find jobs", "Applications", "Profile"]);
    expect(screen.queryByText(/recruiter|approval/i)).toBeNull();
  });

  it("marks the current page, and Home only on the home page", () => {
    render(<DeskNav role="APPLICANT" />);

    expect(within(sideColumn()).getByRole("link", { name: "Find jobs" })).toHaveAttribute("aria-current", "page");
    expect(within(sideColumn()).getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
    // The bar at the left edge goes with the current entry only
    expect(within(sideColumn()).getByRole("link", { name: "Find jobs" })).toHaveClass("before:bg-primary");
    expect(within(sideColumn()).getByRole("link", { name: "Home" })).not.toHaveClass("before:bg-primary");
  });

  // jsdom has no CSS, so where the bars show is checked in e2e/role-shell.spec.ts
  it("marks the current dock entry by colour, weight and a bar above it", () => {
    render(<DeskNav role="APPLICANT" />);
    const dock = screen.getAllByRole("navigation", { name: "Navigation" })[2];
    const current = within(dock).getByRole("link", { name: "Jobs" });

    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).toHaveClass("text-primary", "font-semibold", "before:-top-2");
    expect(within(dock).getByRole("link", { name: "Home" })).not.toHaveClass("before:-top-2");
  });

  it("gives an administrator only the administrator's entries", () => {
    render(<DeskNav role="ADMINISTRATOR" />);

    expect(within(sideColumn()).getByRole("link", { name: "Posting approvals" })).toHaveAttribute(
      "href",
      "/admin/postings",
    );
    expect(within(sideColumn()).getByRole("link", { name: "Users" })).toHaveAttribute("href", "/admin/users");
    expect(screen.queryByText("Find jobs")).toBeNull();
  });

  it("gives a recruiter a way to the posting form until the postings list exists", () => {
    render(<DeskNav role="RECRUITER" />);

    expect(within(sideColumn()).getByRole("link", { name: "Postings" })).toHaveAttribute(
      "href",
      "/recruiter/postings",
    );
    expect(screen.queryByText("Find jobs")).toBeNull();
  });
});
