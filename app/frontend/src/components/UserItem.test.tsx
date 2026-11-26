import { fireEvent, render, screen } from "@testing-library/react";
import { AccountChangeRefused, changeRecruiterAccount, type UserRow } from "@/lib/api";
import UserItem from "./UserItem";

vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  changeRecruiterAccount: vi.fn(),
}));

const recruiter: UserRow = {
  userId: 7, firstName: "Riley", lastName: "Chen", email: "riley.chen@example.com",
  role: "RECRUITER", accountStatus: "ACTIVE", deactivated: false,
};

function renderItem(user: UserRow) {
  render(
    <ul>
      <UserItem user={user} token="t" />
    </ul>,
  );
}

// Minimum scope Administrator 3, FR-ADM.2
describe("UserItem", () => {
  afterEach(() => vi.resetAllMocks());

  it("deactivates an active recruiter and then offers to reactivate", async () => {
    vi.mocked(changeRecruiterAccount).mockResolvedValue({ ...recruiter, accountStatus: "INACTIVE", deactivated: true });
    renderItem(recruiter);

    fireEvent.click(screen.getByRole("button", { name: "Deactivate Riley Chen" }));

    expect(await screen.findByText("Deactivated")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reactivate Riley Chen" })).toBeInTheDocument();
    expect(changeRecruiterAccount).toHaveBeenCalledWith("t", 7, "deactivate");
  });

  it("offers nothing for a pending or denied recruiter, or for another role", () => {
    renderItem({ ...recruiter, accountStatus: "PENDING_APPROVAL" });
    renderItem({ ...recruiter, userId: 8, accountStatus: "INACTIVE", deactivated: false });
    renderItem({ ...recruiter, userId: 9, role: "APPLICANT" });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Pending approval")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("shows the backend's reason when the change is refused", async () => {
    vi.mocked(changeRecruiterAccount).mockRejectedValue(
      new AccountChangeRefused("Only a deactivated recruiter can be reactivated."),
    );
    renderItem({ ...recruiter, accountStatus: "INACTIVE", deactivated: true });

    fireEvent.click(screen.getByRole("button", { name: "Reactivate Riley Chen" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Only a deactivated recruiter can be reactivated.");
  });
});
