import { render, screen } from "@testing-library/react";
import AboutPage from "./page";

describe("AboutPage", () => {
  it("says what the application is and links the team website", () => {
    render(<AboutPage />);

    expect(screen.getByRole("heading", { level: 1, name: "CareerBridge" })).toBeInTheDocument();
    expect(screen.getByText(/semester project of team CareerBridge/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "team website" })).toHaveAttribute(
      "href",
      "https://reaganbaylor.github.io/careerbridge-csi5324-hub/",
    );
  });
});
