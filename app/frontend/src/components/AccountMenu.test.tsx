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

  it("offers a visitor to register", () => {
    render(<AccountMenu user={null} />);
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/register");
  });

  it("offers only Register on the log-in page (mockup visitor-login)", () => {
    pathname = "/login";
    render(<AccountMenu user={null} />);
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/register");
    pathname = "/jobs/3";
  });

  it("offers only Log in on the register page (mockup visitor-register)", () => {
    pathname = "/register";
    render(<AccountMenu user={null} />);
    expect(screen.queryByRole("link", { name: "Register" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument();
    pathname = "/jobs/3";
  });

  it("offers a visitor the small header buttons of the mockup", () => {
    render(<AccountMenu user={null} />);
    expect(screen.getByRole("link", { name: "Log in" })).toHaveClass("btn-sm");
    expect(screen.getByRole("link", { name: "Register" })).toHaveClass("btn-sm");
  });

  it("keeps Log out behind the avatar until the account menu is opened", () => {
    render(<AccountMenu user={riley} />);

    const avatar = screen.getByRole("button", { name: "Account menu for Riley Chen, Recruiter" });
    expect(avatar).toHaveTextContent("RC");
    expect(avatar).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();

    fireEvent.click(avatar);
    expect(avatar).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });

  it("closes the account menu on Escape and on a click elsewhere", () => {
    render(<AccountMenu user={riley} />);
    const avatar = screen.getByRole("button", { name: "Account menu for Riley Chen, Recruiter" });

    fireEvent.click(avatar);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();
    expect(avatar).toHaveFocus();

    fireEvent.click(avatar);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();
  });

  it("closes the account menu when the keyboard moves on past it", () => {
    render(
      <>
        <AccountMenu user={riley} />
        <a href="/about">Next on the page</a>
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Account menu for Riley Chen, Recruiter" }));

    fireEvent.blur(screen.getByRole("button", { name: "Log out" }), {
      relatedTarget: screen.getByRole("link", { name: "Next on the page" }),
    });
    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();
  });

  it("logs the user out from the account menu", () => {
    saveSession({ token: "t", user: riley });
    render(<AccountMenu user={riley} />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu for Riley Chen, Recruiter" }));
    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(readSession()).toBeNull();
    expect(push).toHaveBeenCalledWith("/");
    expect(refresh).toHaveBeenCalled();
  });
});
