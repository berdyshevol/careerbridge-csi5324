import { render, screen } from "@testing-library/react";
import { searchPostings, SessionEnded, viewApplications } from "@/lib/api";
import type { DeskApplication } from "@/lib/sampleDesk";
import { serverSession } from "@/lib/serverSession";
import type { Role, Session } from "@/lib/session";
import DeskPage from "./page";

vi.mock("@/lib/serverSession", () => ({ serverSession: vi.fn() }));
vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  searchPostings: vi.fn(),
  viewApplications: vi.fn(),
}));
const refresh = vi.fn();
vi.mock("next/navigation", async (importActual) => ({
  ...(await importActual<typeof import("next/navigation")>()),
  useRouter: () => ({ refresh, push: vi.fn(), replace: vi.fn() }),
}));

function as(role: Role): Session {
  return {
    token: "t",
    user: {
      firstName: "Riley",
      lastName: "Chen",
      email: "r@example.com",
      phone: null,
      role,
    },
  };
}

const application: DeskApplication = {
  applicationId: 1,
  postingId: 2,
  title: "Data Analyst Intern",
  organizationName: "Waco Health Partners",
  location: "Hybrid",
  employmentType: "Internship",
  applicationStatus: "Applied",
};

// The desk is the logged-in Applicant's (UC-05); only a visitor is asked to log in
describe("home page", () => {
  beforeEach(() => {
    vi.mocked(searchPostings).mockResolvedValue([]);
  });
  afterEach(() => {
    vi.mocked(serverSession).mockReset();
    vi.mocked(viewApplications).mockReset();
    refresh.mockReset();
  });

  it("asks a visitor to log in as an applicant", async () => {
    vi.mocked(serverSession).mockResolvedValue(null);
    render(await DeskPage());

    expect(
      screen.getByRole("heading", { name: "Welcome to CareerBridge" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Log in as an applicant" }),
    ).toHaveAttribute("href", "/login");
    expect(viewApplications).not.toHaveBeenCalled();
  });

  it("shows an applicant their active applications", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("APPLICANT"));
    vi.mocked(viewApplications).mockResolvedValue({
      active: [application],
      appliedPostingIds: [2],
    });
    render(await DeskPage());

    expect(
      screen.getByRole("heading", { name: "Welcome back, Riley" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 of 5 active")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Log in as an applicant" }),
    ).not.toBeInTheDocument();
  });

  it("asks an applicant whose session the backend refused to log in again", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("APPLICANT"));
    vi.mocked(viewApplications).mockRejectedValue(new SessionEnded());
    render(await DeskPage());

    expect(screen.getByText("Your session has ended.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in again" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it.each(["RECRUITER", "ADMINISTRATOR"] as const)(
    "asks no logged-in %s to log in as an applicant",
    async (role) => {
      vi.mocked(serverSession).mockResolvedValue(as(role));
      render(await DeskPage());

      expect(
        screen.getByRole("heading", { name: "Welcome back, Riley" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Recently published" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Your applications" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /Log in/ }),
      ).not.toBeInTheDocument();
      expect(viewApplications).not.toHaveBeenCalled();
    },
  );
});
