import { fireEvent, render, screen } from "@testing-library/react";
import { clearSession, readSession, saveSession } from "@/lib/session";
import AccountMenu from "./AccountMenu";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

const pat = { firstName: "Pat", lastName: "Kim", email: "pat@example.com", phone: null, role: "APPLICANT" as const };

describe("AccountMenu", () => {
  afterEach(() => {
    push.mockReset();
    refresh.mockReset();
    clearSession();
  });

  it("offers a visitor to register", () => {
    render(<AccountMenu user={null} />);
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/register");
  });

  it("shows who is logged in and logs them out", () => {
    saveSession({ token: "t", user: pat });
    render(<AccountMenu user={pat} />);

    expect(screen.getByLabelText("Pat Kim, Applicant")).toHaveTextContent("PK");
    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(readSession()).toBeNull();
    expect(push).toHaveBeenCalledWith("/");
    expect(refresh).toHaveBeenCalled();
  });
});
