import { render, screen } from "@testing-library/react";
import { SessionEnded, viewUsers, type UserDirectory } from "@/lib/api";
import { serverSession } from "@/lib/serverSession";
import type { Role, Session } from "@/lib/session";
import AdminUsersPage from "./page";

vi.mock("@/lib/serverSession", () => ({ serverSession: vi.fn() }));
vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  viewUsers: vi.fn(),
}));
vi.mock("next/navigation", async (importActual) => ({
  ...(await importActual<typeof import("next/navigation")>()),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

function as(role: Role): Session {
  return { token: "t", user: { firstName: "Avery", lastName: "Morgan", email: "admin@careerbridge.example", phone: null, role } };
}

const directory: UserDirectory = {
  usersByRole: { APPLICANT: 1, RECRUITER: 0, ADMINISTRATOR: 1 },
  users: [
    { userId: 1, firstName: "Avery", lastName: "Morgan", email: "admin@careerbridge.example", role: "ADMINISTRATOR", accountStatus: "ACTIVE" },
    { userId: 3, firstName: "Jordan", lastName: "Lee", email: "jordan.lee@example.com", role: "APPLICANT", accountStatus: "ACTIVE" },
  ],
};

async function show() {
  render(await AdminUsersPage());
}

describe("AdminUsersPage", () => {
  afterEach(() => {
    vi.mocked(serverSession).mockReset();
    vi.mocked(viewUsers).mockReset();
  });

  it("lists the users for the administrator", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("ADMINISTRATOR"));
    vi.mocked(viewUsers).mockResolvedValue(directory);

    await show();

    expect(screen.getByRole("heading", { level: 1, name: "Users" })).toBeInTheDocument();
    expect(screen.getByText("Jordan Lee")).toBeInTheDocument();
    expect(vi.mocked(viewUsers)).toHaveBeenCalledWith("t");
  });

  it.each<Role>(["APPLICANT", "RECRUITER"])("refuses the list to a %s without asking the backend", async (role) => {
    vi.mocked(serverSession).mockResolvedValue(as(role));

    await show();

    expect(screen.getByText(/Only an administrator sees the list of users\./)).toBeInTheDocument();
    expect(vi.mocked(viewUsers)).not.toHaveBeenCalled();
  });

  it("asks a visitor to log in", async () => {
    vi.mocked(serverSession).mockResolvedValue(null);

    await show();

    expect(screen.getByText("Log in as the administrator to see the users.")).toBeInTheDocument();
  });

  it("asks to log in again when the session has ended", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("ADMINISTRATOR"));
    vi.mocked(viewUsers).mockRejectedValue(new SessionEnded());

    await show();

    expect(screen.getByText("Your session has ended")).toBeInTheDocument();
  });

  it("says so when the list cannot be loaded", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("ADMINISTRATOR"));
    vi.mocked(viewUsers).mockRejectedValue(new Error("Backend answered 500"));

    await show();

    expect(screen.getByRole("alert")).toHaveTextContent("The users could not be loaded. Try again in a moment.");
  });
});
