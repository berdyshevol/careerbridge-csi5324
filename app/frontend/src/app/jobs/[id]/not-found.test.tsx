import { render, screen } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import PostingNotFound from "./not-found";

vi.mock("next/navigation", () => ({ useSearchParams: vi.fn() }));

function openAt(query: string) {
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams(query) as ReturnType<typeof useSearchParams>);
  render(<PostingNotFound />);
}

describe("PostingNotFound", () => {
  it("says the posting could not be found and leads back to the job board", () => {
    openAt("");

    expect(screen.getByText("This posting could not be found.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to results" })).toHaveAttribute("href", "/jobs");
  });

  it("leads back to the same search", () => {
    openAt("keyword=analyst&location=On-site&page=2");

    expect(screen.getByRole("link", { name: "Back to results" })).toHaveAttribute(
      "href",
      "/jobs?keyword=analyst&location=On-site",
    );
  });
});
