import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ApplicationActionRefused,
  requestWithdrawal,
  withdrawApplication,
  type ApplicationDetail,
  type WithdrawalPrompt,
} from "@/lib/api";
import WithdrawAction from "./WithdrawAction";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));
vi.mock("@/lib/useEndSession", () => ({
  useEndSession: () => vi.fn(),
}));
vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  requestWithdrawal: vi.fn(),
  withdrawApplication: vi.fn(),
}));

const prompt: WithdrawalPrompt = {
  applicationId: 12,
  title: "Backend Developer",
  organizationName: "Brazos Analytics",
  applicationStatus: "Interview",
  warning: "Withdrawing this application is final. You cannot reapply to this posting.",
  reasons: ["Accepted another offer", "No longer interested", "Other"],
};

describe("WithdrawAction", () => {
  afterEach(() => {
    vi.mocked(requestWithdrawal).mockReset();
    vi.mocked(withdrawApplication).mockReset();
    refresh.mockReset();
  });

  it("opens confirmation dialog with warning and makes no change when cancelled (FR-UC06.2, FR-UC06.3)", async () => {
    vi.mocked(requestWithdrawal).mockResolvedValue(prompt);
    const user = userEvent.setup();
    render(<WithdrawAction applicationId={12} token="t" />);

    await user.click(screen.getByRole("button", { name: "Withdraw application" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Withdrawing this application is final/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Go back" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(withdrawApplication).not.toHaveBeenCalled();
  });

  it("confirms withdrawal with optional reason and shows updated active count (FR-UC06.5, FR-UC06.6)", async () => {
    vi.mocked(requestWithdrawal).mockResolvedValue(prompt);
    vi.mocked(withdrawApplication).mockResolvedValue({
      application: { applicationStatus: "Withdrawn" } as ApplicationDetail,
      activeApplicationCount: 2,
      applicationLimit: 5,
    });
    const user = userEvent.setup();
    render(<WithdrawAction applicationId={12} token="t" />);

    await user.click(screen.getByRole("button", { name: "Withdraw application" }));
    await user.selectOptions(screen.getByLabelText("Reason, optional"), "No longer interested");
    await user.click(screen.getByRole("button", { name: "Withdraw, final" }));

    expect(withdrawApplication).toHaveBeenCalledWith("t", 12, "No longer interested");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Application withdrawn. You now have 2 of 5 active applications.",
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("shows refusal message and refreshes when stage changed (ext 4a, 4b)", async () => {
    vi.mocked(requestWithdrawal).mockResolvedValue(prompt);
    vi.mocked(withdrawApplication).mockRejectedValue(
      new ApplicationActionRefused(
        "This application is at the Offer stage. Use Decline on the offer instead.",
        "Offer",
      ),
    );
    const user = userEvent.setup();
    render(<WithdrawAction applicationId={12} token="t" />);

    await user.click(screen.getByRole("button", { name: "Withdraw application" }));
    await user.click(screen.getByRole("button", { name: "Withdraw, final" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/Offer stage/);
    expect(refresh).toHaveBeenCalled();
  });
});

