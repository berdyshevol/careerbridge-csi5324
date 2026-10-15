import { render, screen, within } from "@testing-library/react";
import AboutPage from "./page";

describe("AboutPage", () => {
  it("names the group and links the application, the repository and the Jira board", () => {
    render(<AboutPage />);

    expect(screen.getByRole("heading", { level: 1, name: "CareerBridge" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Application" })).toHaveAttribute(
      "href",
      "https://careerbridge-csi5324.vercel.app",
    );
    expect(screen.getByRole("link", { name: "Group repository" })).toHaveAttribute(
      "href",
      "https://github.com/berdyshevol/careerbridge-csi5324",
    );
    expect(screen.getByRole("link", { name: "Jira board" })).toHaveAttribute(
      "href",
      expect.stringContaining("careerbridge-csi5324.atlassian.net"),
    );
  });

  it("lists every member with a role and all 15 use cases", () => {
    render(<AboutPage />);

    const team = screen.getByRole("region", { name: "Team" });
    expect(within(team).getAllByRole("listitem")).toHaveLength(5);
    expect(team.textContent?.match(/UC-\d\d/g)).toHaveLength(15);
    expect(screen.getByText("Reagan Rubio")).toBeInTheDocument();
    expect(screen.getByText("Quality Assurance Engineer")).toBeInTheDocument();
  });
});
