import { fireEvent, render, screen } from "@testing-library/react";
import { decideRecruiterRequest, MembershipConflict, type RecruiterRequestDetails } from "@/lib/api";
import RecruiterRequestReview from "./RecruiterRequestReview";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));
vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  decideRecruiterRequest: vi.fn(),
}));

const ORGANIZATION = {
  organizationId: 5,
  name: "Waco Freight Co.",
  website: "wacofreight.example",
  industry: "Logistics",
  headquarters: "Waco, TX",
  size: "51-200 people",
  description: "Regional trucking.",
};

function request(changes: Partial<RecruiterRequestDetails> = {}): RecruiterRequestDetails {
  return {
    requestId: 9,
    requestType: "NEW_RECRUITER_NEW_ORGANIZATION",
    requestTypeLabel: "New recruiter, new organization",
    status: "PENDING",
    statusLabel: "Pending",
    requestedAt: "2026-10-28T12:00:00Z",
    reviewFlag: "Work email domain does not match the organization's website",
    requester: { name: "Lee Huang", email: "lee.huang@gmail.example", jobTitle: "HR manager", phone: null },
    memberships: [],
    organization: ORGANIZATION,
    role: null,
    justification: null,
    decisionNote: null,
    duplicateOf: null,
    ...changes,
  };
}

// UC-10 Approve Recruiter/Organization Request, steps 4-8
describe("RecruiterRequestReview", () => {
  afterEach(() => {
    vi.mocked(decideRecruiterRequest).mockReset();
    push.mockReset();
  });

  it("shows the requester, the organization and the review flag (step 4)", () => {
    render(<RecruiterRequestReview token="t" request={request()} />);

    expect(screen.getByRole("heading", { level: 1, name: "Lee Huang" })).toBeInTheDocument();
    expect(screen.getByText("Flagged for review.")).toBeInTheDocument();
    expect(screen.getByText("None yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "wacofreight.example ↗" })).toHaveAttribute("href", "https://wacofreight.example");
  });

  it("approves and returns to the queue (steps 5-8)", async () => {
    vi.mocked(decideRecruiterRequest).mockResolvedValue({} as never);
    render(<RecruiterRequestReview token="t" request={request()} />);

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/admin/requests"));
    expect(decideRecruiterRequest).toHaveBeenCalledWith("t", 9, "approve", "");
  });

  it("names the registered organization when the new one duplicates it (5c)", () => {
    render(<RecruiterRequestReview token="t" request={request({ duplicateOf: { ...ORGANIZATION, organizationId: 1 } })} />);

    expect(screen.getByRole("button", { name: "Approve membership in the existing Waco Freight Co. instead" })).toBeInTheDocument();
    expect(screen.getByText("The duplicate organization record is discarded.")).toBeInTheDocument();
  });

  it("needs a reason to deny (5a)", () => {
    render(<RecruiterRequestReview token="t" request={request()} />);

    fireEvent.click(screen.getByRole("button", { name: "Deny" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Write the reason Lee will receive.");
    expect(decideRecruiterRequest).not.toHaveBeenCalled();
  });

  it("shows the current status when another administrator decided first (6a)", async () => {
    vi.mocked(decideRecruiterRequest).mockRejectedValue(
      new MembershipConflict("ACTIVE", "Active", "This request is now Approved. Nothing was changed."),
    );
    render(<RecruiterRequestReview token="t" request={request()} />);

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    expect(await screen.findByText(/This request is now Approved\. Nothing was changed\./)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
