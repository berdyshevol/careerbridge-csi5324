import { render, screen, within } from "@testing-library/react";
import { redirect } from "next/navigation";
import { searchPostings, type JobPosting, type PageQuery } from "@/lib/api";
import { serverSession } from "@/lib/serverSession";
import JobsPage from "./page";

vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  searchPostings: vi.fn(),
}));
vi.mock("@/lib/serverSession", () => ({ serverSession: vi.fn() }));
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

const backend: JobPosting = {
  ...internship,
  jobPostId: 1,
  title: "Backend Developer",
  location: "Remote",
  employmentType: "Full-time",
  organization: { organizationId: 1, name: "Brazos Analytics" },
};

async function openJobBoard(criteria: PageQuery) {
  render(await JobsPage({ searchParams: Promise.resolve(criteria) }));
}

function organizationOptions() {
  return within(screen.getByRole("combobox", { name: "Organization" }))
    .getAllByRole("option")
    .map((option) => option.textContent);
}

describe("JobsPage", () => {
  afterEach(() => {
    vi.mocked(searchPostings).mockReset();
    vi.mocked(serverSession).mockReset();
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

  it("searches with the criteria from the address and shows them in the labelled form", async () => {
    vi.mocked(searchPostings).mockResolvedValue([internship]);

    await openJobBoard({
      keyword: "data",
      location: "On-site",
      organization: "Waco Health Partners",
      employmentType: "Internship",
    });

    expect(searchPostings).toHaveBeenCalledWith({
      keyword: "data",
      location: "On-site",
      organization: "Waco Health Partners",
      employmentType: "Internship",
    });
    expect(screen.getByRole("searchbox", { name: "Keywords" })).toHaveValue("data");
    expect(screen.getByRole("combobox", { name: "Location" })).toHaveValue("On-site");
    expect(screen.getByRole("combobox", { name: "Organization" })).toHaveValue("Waco Health Partners");
    expect(screen.getByRole("combobox", { name: "Employment type" })).toHaveValue("Internship");
  });

  it("offers the locations, the organizations of the open postings and the employment types", async () => {
    vi.mocked(searchPostings).mockResolvedValue([internship, backend]);

    await openJobBoard({});

    const location = within(screen.getByRole("combobox", { name: "Location" })).getAllByRole("option");
    expect(location.map((option) => option.textContent)).toEqual(["Any location", "On-site", "Hybrid", "Remote"]);
    expect(organizationOptions()).toEqual(["All organizations", "Brazos Analytics", "Waco Health Partners"]);
    expect(screen.getByRole("option", { name: "Any type" })).toBeInTheDocument();
  });

  it("lists every organization with an open posting even when the criteria narrow the results", async () => {
    vi.mocked(searchPostings).mockImplementation(async (criteria) =>
      criteria?.location ? [internship] : [internship, backend],
    );

    await openJobBoard({ location: "On-site" });

    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(organizationOptions()).toEqual(["All organizations", "Brazos Analytics", "Waco Health Partners"]);
  });

  it("shows only the chosen organization, not another whose name contains it", async () => {
    const labs: JobPosting = {
      ...backend,
      jobPostId: 9,
      title: "Lab Technician",
      organization: { organizationId: 9, name: "Brazos Analytics Labs" },
    };
    vi.mocked(searchPostings).mockResolvedValue([backend, labs]);

    await openJobBoard({ organization: "Brazos Analytics" });

    expect(screen.getByRole("link", { name: "Backend Developer" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Lab Technician" })).not.toBeInTheDocument();
  });

  it("shows each result's title, organization, location, type and deadline", async () => {
    vi.mocked(searchPostings).mockResolvedValue([internship]);

    await openJobBoard({});

    expect(screen.getByRole("link", { name: "Data Analyst Intern" })).toBeInTheDocument();
    expect(screen.getByText("Waco Health Partners · On-site · Internship")).toBeInTheDocument();
    expect(screen.getByText("Apply by Dec 15, 2026")).toBeInTheDocument();
  });

  it("tells a visitor that no account is needed", async () => {
    vi.mocked(searchPostings).mockResolvedValue([internship]);

    await openJobBoard({});

    expect(
      screen.getByText("Every organization's open postings, newest first. No account needed."),
    ).toBeInTheDocument();
  });

  it("does not tell a logged-in applicant that no account is needed", async () => {
    vi.mocked(searchPostings).mockResolvedValue([internship]);
    vi.mocked(serverSession).mockResolvedValue({
      token: "t",
      user: { firstName: "Maya", lastName: "Patel", email: "maya@example.com", phone: null, role: "APPLICANT" },
    });

    await openJobBoard({});

    expect(screen.getByText("Every organization's open postings, newest first.")).toBeInTheDocument();
    expect(screen.queryByText(/No account needed/)).not.toBeInTheDocument();
  });

  it("says there are no open positions when nothing is open and nothing was asked (2a)", async () => {
    vi.mocked(searchPostings).mockResolvedValue([]);

    await openJobBoard({});

    expect(screen.getByText("No open positions right now.")).toBeInTheDocument();
    expect(screen.queryByText("No matching postings.")).not.toBeInTheDocument();
  });

  it("says nothing matches when the criteria find no posting (2b)", async () => {
    vi.mocked(searchPostings).mockImplementation(async (criteria) => (criteria?.keyword ? [] : [internship]));

    await openJobBoard({ keyword: "astronaut" });

    expect(screen.getByText("No matching postings.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Data Analyst Intern" })).not.toBeInTheDocument();
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

  it("says the search failed and keeps every criterion when the backend fails (*a)", async () => {
    vi.mocked(searchPostings).mockRejectedValue(new Error("timed out"));

    await openJobBoard({ keyword: "data", organization: "Waco Health Partners", employmentType: "Internship" });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The search failed. Your criteria are kept; select Search to try again.",
    );
    expect(screen.getByRole("searchbox", { name: "Keywords" })).toHaveValue("data");
    expect(screen.getByRole("combobox", { name: "Organization" })).toHaveValue("Waco Health Partners");
    expect(screen.getByRole("combobox", { name: "Employment type" })).toHaveValue("Internship");
  });
});
