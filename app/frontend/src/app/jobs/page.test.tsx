import { render, screen } from "@testing-library/react";
import { searchPostings, type JobPosting, type PostingSearchCriteria } from "@/lib/api";
import JobsPage from "./page";

vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  searchPostings: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const internship: JobPosting = {
  jobPostId: 3,
  title: "Data Analyst Intern",
  description: "",
  jobRequirements: "",
  location: "On-site",
  employmentType: "Internship",
  salaryRange: null,
  numberOfOpenings: 1,
  datePosted: "2026-10-03",
  applicationDeadline: "2026-12-15",
  postStatus: "PUBLISHED",
  organization: { organizationId: 2, name: "Waco Health Partners" },
};

async function openJobBoard(criteria: PostingSearchCriteria) {
  render(await JobsPage({ searchParams: Promise.resolve(criteria) }));
}

describe("JobsPage", () => {
  afterEach(() => {
    vi.mocked(searchPostings).mockReset();
  });

  it("searches with the criteria from the address and shows them in the form", async () => {
    vi.mocked(searchPostings).mockResolvedValue([internship]);

    await openJobBoard({ keyword: "data", location: "On-site", employmentType: "Internship" });

    expect(searchPostings).toHaveBeenCalledWith({
      keyword: "data",
      location: "On-site",
      employmentType: "Internship",
    });
    expect(screen.getByRole("searchbox", { name: "Search job postings" })).toHaveValue("data");
    expect(screen.getByRole("combobox", { name: "Location" })).toHaveValue("On-site");
    expect(screen.getByRole("combobox", { name: "Employment type" })).toHaveValue("Internship");
  });

  it("offers any location and any type when nothing is chosen", async () => {
    vi.mocked(searchPostings).mockResolvedValue([internship]);

    await openJobBoard({});

    expect(screen.getByRole("combobox", { name: "Location" })).toHaveValue("");
    expect(screen.getByRole("option", { name: "Any location" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Any type" })).toBeInTheDocument();
  });

  it("links each posting with the search, so the visitor can come back to it", async () => {
    vi.mocked(searchPostings).mockResolvedValue([internship]);

    await openJobBoard({ location: "On-site" });

    expect(screen.getByRole("link", { name: "Data Analyst Intern" })).toHaveAttribute(
      "href",
      "/jobs/3?location=On-site",
    );
  });

  it("keeps the visitor's criteria when the backend fails", async () => {
    vi.mocked(searchPostings).mockRejectedValue(new Error("timed out"));

    await openJobBoard({ keyword: "data", employmentType: "Internship" });

    expect(screen.getByRole("searchbox", { name: "Search job postings" })).toHaveValue("data");
    expect(screen.getByRole("combobox", { name: "Employment type" })).toHaveValue("Internship");
  });
});
