import { render, screen } from "@testing-library/react";
import { viewPosting, type JobPosting } from "@/lib/api";
import LogInPage from "./page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  viewPosting: vi.fn(),
}));

const posting = { title: "Backend Developer", organization: { name: "Brazos Analytics" } } as JobPosting;

async function renderWith(next?: string) {
  render(await LogInPage({ searchParams: Promise.resolve(next ? { next } : {}) }));
}

// `/login`, screen visitor-login (spec/screens); Log In
describe("log-in page", () => {
  afterEach(() => vi.mocked(viewPosting).mockReset());

  it("puts the title above the form, with the register link under it", async () => {
    await renderWith();

    expect(screen.getByRole("heading", { level: 1, name: "Log in" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Log in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Register as an applicant" })).toHaveAttribute("href", "/register");
    expect(viewPosting).not.toHaveBeenCalled();
  });

  // One page for every role, so applicants, recruiters and administrators all find it
  it("links to the forgotten-password page", async () => {
    await renderWith();

    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "/forgot-password");
  });

  it.each(["/jobs/3", "/jobs/3/apply"])("names the posting a visitor came from (%s)", async (next) => {
    vi.mocked(viewPosting).mockResolvedValue(posting);
    await renderWith(next);

    expect(viewPosting).toHaveBeenCalledWith("3");
    expect(screen.getByRole("link", { name: "Register as an applicant" })).toHaveAttribute(
      "href",
      `/register?next=${encodeURIComponent(next)}`,
    );
    expect(
      screen.getByText("Log in to apply for Backend Developer at Brazos Analytics. You come back to it afterwards."),
    ).toBeInTheDocument();
  });

  it("says the server is waking when the posting cannot be read", async () => {
    vi.mocked(viewPosting).mockRejectedValue(new Error("Backend answered 503"));
    await renderWith("/jobs/3");

    expect(screen.getByRole("alert")).toHaveTextContent("is not answering");
    expect(screen.queryByRole("form", { name: "Log in" })).not.toBeInTheDocument();
  });

  it("has no subtitle for a page that is not a posting, or a posting that is gone", async () => {
    await renderWith("/applications");
    expect(viewPosting).not.toHaveBeenCalled();
    expect(screen.queryByText(/Log in to apply for/)).not.toBeInTheDocument();

    vi.mocked(viewPosting).mockResolvedValue(null);
    await renderWith("/jobs/99");
    expect(screen.queryByText(/Log in to apply for/)).not.toBeInTheDocument();
  });
});
