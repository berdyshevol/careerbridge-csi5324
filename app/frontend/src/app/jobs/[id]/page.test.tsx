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
  closesAt: "2999-12-16T05:59:00Z",
  postStatus: "PUBLISHED",
  organization: { organizationId: 2, name: "Waco Health Partners" },
};

async function openPosting(shown: JobPosting) {
  vi.mocked(viewPosting).mockResolvedValue(shown);
  render(await PostingPage({ params: Promise.resolve({ id: "3" }), searchParams: Promise.resolve({}) }));
}

describe("PostingPage", () => {
  it("shows an open posting's details and offers to apply", async () => {
    await openPosting({ ...posting, description: "Clean clinic data", jobRequirements: "SQL" });

    expect(screen.getByRole("heading", { level: 1, name: "Data Analyst Intern" })).toBeInTheDocument();
    expect(screen.getByText("Waco Health Partners · On-site · Internship")).toBeInTheDocument();
    expect(screen.getByText("Clean clinic data")).toBeInTheDocument();
    expect(screen.getByText("SQL")).toBeInTheDocument();
    expect(screen.getByText("Apply by").nextSibling).toHaveTextContent("Dec 15, 2999");
    expect(screen.getByText("Openings").nextSibling).toHaveTextContent("1");
    expect(screen.getByRole("link", { name: "Apply" })).toHaveAttribute("href", "/jobs/3/apply");
  });

  it("says a closed posting no longer accepts applications and does not offer to apply (5a)", async () => {
    await openPosting({ ...posting, postStatus: "CLOSED" });

    expect(screen.getByRole("status")).toHaveTextContent("This posting is no longer accepting applications.");
    expect(screen.queryByRole("link", { name: "Apply" })).not.toBeInTheDocument();
  });

  it("does not offer to apply once the deadline has passed (5a)", async () => {
    await openPosting({ ...posting, applicationDeadline: "2020-01-01", closesAt: "2020-01-02T05:59:00Z" });

    expect(screen.getByRole("status")).toHaveTextContent("This posting is no longer accepting applications.");
    expect(screen.queryByRole("link", { name: "Apply" })).not.toBeInTheDocument();
  });

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
