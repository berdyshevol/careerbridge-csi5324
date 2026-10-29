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
  });

  it("gives an administrator only the administrator's entries", () => {
    render(<DeskNav role="ADMINISTRATOR" />);

    expect(within(sideColumn()).getByRole("link", { name: "Posting approvals" })).toHaveAttribute(
      "href",
      "/admin/postings",
    );
    expect(screen.queryByText("Find jobs")).toBeNull();
  });

  it("gives a recruiter a way to the posting form until the postings list exists", () => {
    render(<DeskNav role="RECRUITER" />);

    expect(within(sideColumn()).getByRole("link", { name: "Postings" })).toHaveAttribute(
      "href",
      "/recruiter/postings/new",
    );
    expect(screen.queryByText("Find jobs")).toBeNull();
  });
});
