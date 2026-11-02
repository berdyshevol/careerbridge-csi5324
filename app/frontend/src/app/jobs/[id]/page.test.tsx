import { render, screen, within } from "@testing-library/react";
import { viewPosting, type JobPosting } from "@/lib/api";
import { serverSession } from "@/lib/serverSession";
import type { Role } from "@/lib/session";
import PostingPage from "./page";

vi.mock("@/lib/serverSession", () => ({ serverSession: vi.fn() }));
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

const closed: Partial<JobPosting> = { postStatus: "CLOSED" };

function loggedInAs(role: Role) {
  vi.mocked(serverSession).mockResolvedValue({
    token: "t",
    user: { firstName: "Riley", lastName: "Chen", email: "r@example.com", phone: null, role },
  });
}

async function openPosting(changes: Partial<JobPosting> = {}, searchParams = {}) {
  vi.mocked(viewPosting).mockResolvedValue({ ...posting, ...changes });
  render(await PostingPage({ params: Promise.resolve({ id: "3" }), searchParams: Promise.resolve(searchParams) }));
}

// The page draws the Apply card twice, under the facts and in the laptop's side panel; CSS shows one
function applyLinks(name: string) {
  return screen.queryAllByRole("link", { name });
}

describe("PostingPage", () => {
  afterEach(() => vi.mocked(serverSession).mockReset());

  it("shows every detail of the posting (FR-UC04.9)", async () => {
    await openPosting({
      description: "Clean clinic data.\nPrepare weekly dashboards.",
      jobRequirements: "Excel\nSQL",
      numberOfOpenings: 2,
    });

    expect(screen.getByRole("heading", { level: 1, name: "Data Analyst Intern" })).toBeInTheDocument();
    expect(screen.getByText("Waco Health Partners")).toBeInTheDocument();
    const facts = within(screen.getByRole("list", { name: "Posting facts" })).getAllByRole("listitem");
    expect(facts.map((fact) => fact.textContent)).toEqual([
      "On-site",
      "Internship",
      "2 openings",
      "Apply by Dec 15, 2999",
    ]);
    expect(screen.getByRole("heading", { name: "About the role" })).toBeInTheDocument();
    expect(screen.getByText("Clean clinic data.")).toBeInTheDocument();
    expect(screen.getByText("Prepare weekly dashboards.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Requirements" })).toBeInTheDocument();
    expect(screen.getByText("Excel").tagName).toBe("LI");
    expect(screen.getByText("SQL").tagName).toBe("LI");
  });

  it("says one opening in the singular", async () => {
    await openPosting();

    expect(screen.getByText("1 opening")).toBeInTheDocument();
  });

  it("offers an applicant the Apply page", async () => {
    loggedInAs("APPLICANT");
    await openPosting();

    expect(screen.getByRole("link", { name: "Apply" })).toHaveAttribute("href", "/jobs/3/apply");
    expect(applyLinks("Log in to apply")).toHaveLength(0);
  });

  it("asks a visitor to log in or register and come back to this posting (UC-04 1a)", async () => {
    await openPosting();

    for (const link of applyLinks("Log in to apply")) {
      expect(link).toHaveAttribute("href", "/login?next=%2Fjobs%2F3");
    }
    for (const link of applyLinks("Register as an applicant")) {
      expect(link).toHaveAttribute("href", "/register?next=%2Fjobs%2F3");
    }
    expect(applyLinks("Log in to apply")).toHaveLength(2);
    expect(applyLinks("Register as an applicant")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Apply for this job" })).toBeInTheDocument();
    expect(applyLinks("Apply")).toHaveLength(0);
  });

  it.each<Role>(["RECRUITER", "ADMINISTRATOR"])("tells a %s that only applicant accounts can apply (UC-04 1b)", async (role) => {
    loggedInAs(role);
    await openPosting();

    const statuses = screen.getAllByRole("status");
    expect(statuses).toHaveLength(2);
    for (const status of statuses) {
      expect(status).toHaveTextContent("Only applicant accounts can apply.");
    }
    expect(applyLinks("Apply")).toHaveLength(0);
    expect(applyLinks("Log in to apply")).toHaveLength(0);
  });

  it("tells an applicant a closed posting no longer accepts applications (UC-04 1c)", async () => {
    loggedInAs("APPLICANT");
    await openPosting(closed);

    expect(screen.getByRole("status")).toHaveTextContent("This posting is no longer accepting applications.");
    expect(screen.queryByRole("link", { name: "Apply" })).not.toBeInTheDocument();
  });

  it("does not offer to apply once the deadline has passed (UC-04 1c)", async () => {
    loggedInAs("APPLICANT");
    await openPosting({ applicationDeadline: "2020-01-01", closesAt: "2020-01-02T05:59:00Z" });

    expect(screen.getByRole("status")).toHaveTextContent("This posting is no longer accepting applications.");
    expect(screen.queryByRole("link", { name: "Apply" })).not.toBeInTheDocument();
  });

  it("tells a visitor a closed posting no longer accepts applications, without asking to log in (UC-04 1c)", async () => {
    await openPosting(closed);

    const statuses = screen.getAllByRole("status");
    expect(statuses).toHaveLength(2);
    for (const status of statuses) {
      expect(status).toHaveTextContent("This posting is no longer accepting applications.");
    }
    expect(applyLinks("Log in to apply")).toHaveLength(0);
    expect(applyLinks("Register as an applicant")).toHaveLength(0);
  });

  it("leads back to the results the visitor searched", async () => {
    await openPosting({}, { keyword: "data", location: "On-site" });

    expect(screen.getByRole("link", { name: "Back to results" })).toHaveAttribute(
      "href",
      "/jobs?keyword=data&location=On-site",
    );
  });
});
