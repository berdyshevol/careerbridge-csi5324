import { render, screen } from "@testing-library/react";
import AboutPage from "./page";

describe("AboutPage", () => {
  it("names the group and links the repository and Jira board", () => {
    render(<AboutPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Career Bridge" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Group repository" })).toHaveAttribute(
      "href",
      "https://github.com/berdyshevol/careerbridge-csi5324",
    );
    expect(screen.getByRole("link", { name: "Jira board" })).toHaveAttribute(
      "href",
      expect.stringContaining("careerbridge-csi5324.atlassian.net"),
    );
  });

  it("lists every member with a role and use cases", () => {
    render(<AboutPage />);

    expect(screen.getAllByRole("listitem").filter((li) => li.querySelector("p.font-semibold"))).toHaveLength(5);
    expect(screen.getByText("Reagan Rubio")).toBeInTheDocument();
    expect(screen.getByText("Quality Assurance Engineer")).toBeInTheDocument();
  });
});
