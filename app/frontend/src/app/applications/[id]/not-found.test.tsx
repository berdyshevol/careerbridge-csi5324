import { render, screen } from "@testing-library/react";
import ApplicationNotFound from "./not-found";

describe("ApplicationNotFound", () => {
  it("says the application could not be found and links back to all applications", () => {
    render(<ApplicationNotFound />);

    expect(screen.getByText("This application could not be found.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /All applications/ })).toHaveAttribute("href", "/applications");
  });
});

