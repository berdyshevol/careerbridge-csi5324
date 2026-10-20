import { render, screen } from "@testing-library/react";
import { viewPosting, type JobPosting } from "@/lib/api";
import PostingPage from "./page";

vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  viewPosting: vi.fn(),
}));

const posting: JobPosting = {
  jobPostId: 3,
  title: "Data Analyst Intern",
  description: "",
  jobRequirements: "",
  location: "On-site",
  employmentType: "Internship",
  salaryRange: null,
  numberOfOpenings: 1,
  datePosted: "2026-10-03",
  applicationDeadline: "2999-12-15",
  postStatus: "PUBLISHED",
  organization: { organizationId: 2, name: "Waco Health Partners" },
};

describe("PostingPage", () => {
  it("leads back to the list the visitor searched", async () => {
    vi.mocked(viewPosting).mockResolvedValue(posting);

    render(
      await PostingPage({
        params: Promise.resolve({ id: "3" }),
        searchParams: Promise.resolve({ keyword: "data", location: "On-site" }),
      }),
    );

    expect(screen.getByRole("link", { name: "All jobs" })).toHaveAttribute(
      "href",
      "/jobs?keyword=data&location=On-site",
    );
  });
});
