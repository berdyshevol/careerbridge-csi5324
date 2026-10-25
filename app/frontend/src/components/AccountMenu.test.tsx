import { fireEvent, render, screen } from "@testing-library/react";
import { clearSession, readSession, saveSession } from "@/lib/session";
import AccountMenu from "./AccountMenu";

const push = vi.fn();
const refresh = vi.fn();
let pathname = "/jobs/3";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  usePathname: () => pathname,
}));

const riley = { firstName: "Riley", lastName: "Chen", email: "riley.chen@example.com", phone: null, role: "RECRUITER" as const };

describe("AccountMenu", () => {
  afterEach(() => {
    push.mockReset();
    refresh.mockReset();
    clearSession();
  });

  it("offers a visitor to log in and come back to this page", () => {
    render(<AccountMenu user={null} />);
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login?next=%2Fjobs%2F3");
  });

  it("does not send the log-in page back to itself", () => {
    pathname = "/login";
    render(<AccountMenu user={null} />);
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    pathname = "/jobs/3";
  });

  it("shows who is logged in and logs them out", () => {
    saveSession({ token: "t", user: riley });
    render(<AccountMenu user={riley} />);

    expect(screen.getByLabelText("Riley Chen, Recruiter")).toHaveTextContent("RC");
    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(readSession()).toBeNull();
    expect(push).toHaveBeenCalledWith("/");
    expect(refresh).toHaveBeenCalled();
  });
});
