import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { searchPostings, type JobPosting, type PageQuery } from "@/lib/api";
import JobsPage from "./page";

vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  searchPostings: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

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

async function openJobBoard(criteria: PageQuery) {
  render(await JobsPage({ searchParams: Promise.resolve(criteria) }));
}

describe("JobsPage", () => {
  afterEach(() => {
    vi.mocked(searchPostings).mockReset();
    vi.mocked(redirect).mockClear();
  });

  it("drops the fields the form sent empty from the address", async () => {
    await expect(openJobBoard({ keyword: "", location: "On-site", employmentType: "" })).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(redirect).toHaveBeenCalledWith("/jobs?location=On-site");
  });

  it("trims the spaces around a criterion in the address", async () => {
    await expect(openJobBoard({ location: " On-site " })).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/jobs?location=On-site");
  });

  it("puts the criteria of a hand-edited address in the form's order", async () => {
    await expect(openJobBoard({ employmentType: "Internship", location: "On-site" })).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(redirect).toHaveBeenCalledWith("/jobs?location=On-site&employmentType=Internship");
  });

  it("leaves a clean address as it is", async () => {
    vi.mocked(searchPostings).mockResolvedValue([internship]);

    await openJobBoard({ location: "On-site" });

    expect(redirect).not.toHaveBeenCalled();
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

  it("sends a link that repeats a criterion to its first value", async () => {
    await expect(openJobBoard({ location: ["On-site", "Remote"] })).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/jobs?location=On-site");
  });

  it("keeps the visitor's criteria when the backend fails", async () => {
    vi.mocked(searchPostings).mockRejectedValue(new Error("timed out"));

    await openJobBoard({ keyword: "data", employmentType: "Internship" });

    expect(screen.getByRole("searchbox", { name: "Search job postings" })).toHaveValue("data");
    expect(screen.getByRole("combobox", { name: "Employment type" })).toHaveValue("Internship");
  });
});
