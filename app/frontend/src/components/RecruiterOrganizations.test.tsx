import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  cancelMembershipRequest,
  MembershipConflict,
  searchOrganizations,
  submitMembershipRequest,
  type Membership,
  type OrganizationSummary,
} from "@/lib/api";
import RecruiterOrganizations from "./RecruiterOrganizations";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  searchOrganizations: vi.fn(),
  submitMembershipRequest: vi.fn(),
  cancelMembershipRequest: vi.fn(),
}));

function organization(organizationId: number, name: string): OrganizationSummary {
  return { organizationId, name, website: `${name.toLowerCase().replace(/ /g, "")}.example`, industry: null, headquarters: null, size: null, description: "Training programs." };
}

function membership(membershipId: number, org: OrganizationSummary, status: Membership["status"], statusLabel: string): Membership {
  return { membershipId, organization: org, status, statusLabel, role: null, requestedAt: "2026-10-28T12:00:00Z", approvedAt: null, decisionNote: null };
}

const BRAZOS = organization(1, "Brazos Health");
const CLINICS = organization(2, "Central Texas Clinics");
const LAB = organization(3, "Waco Learning Lab");

// UC-09 Join Additional Organization
describe("RecruiterOrganizations", () => {
  afterEach(() => vi.resetAllMocks());

  function renderIt() {
    render(
      <RecruiterOrganizations
        token="t"
        initial={[membership(10, BRAZOS, "ACTIVE", "Active"), membership(11, CLINICS, "PENDING", "Pending")]}
      />,
    );
  }

  async function chooseLab() {
    vi.mocked(searchOrganizations).mockResolvedValue([LAB]);
    fireEvent.change(screen.getByLabelText("Search organizations by name or website"), { target: { value: "waco" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    fireEvent.click(await screen.findByRole("button", { name: "Waco Learning Lab" }));
    fireEvent.change(screen.getByLabelText("Your role at Waco Learning Lab"), { target: { value: "Contract recruiter" } });
    fireEvent.change(screen.getByLabelText("Why you recruit for them"), { target: { value: "Shared team." } });
  }

  it("lists the memberships with their status, and only a pending one can be cancelled", () => {
    renderIt();

    const list = within(screen.getByRole("list", { name: "Your memberships" }));
    expect(list.getByText("Active")).toBeInTheDocument();
    expect(list.getByText("Pending")).toBeInTheDocument();
    expect(list.getAllByRole("button", { name: /^Cancel request/ })).toHaveLength(1);
  });

  it("searches, shows the summary and lists the new request as Pending (steps 2-8)", async () => {
    vi.mocked(submitMembershipRequest).mockResolvedValue(membership(12, LAB, "PENDING", "Pending"));
    renderIt();

    await chooseLab();
    expect(screen.getByText("Training programs.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Send request" }));

    const list = within(screen.getByRole("list", { name: "Your memberships" }));
    expect(await list.findByText("Waco Learning Lab")).toBeInTheDocument();
    expect(submitMembershipRequest).toHaveBeenCalledWith("t", { organizationId: 3, role: "Contract recruiter", justification: "Shared team." });
  });

  it("shows the existing status when the recruiter already asked (6b)", async () => {
    vi.mocked(submitMembershipRequest).mockRejectedValue(
      new MembershipConflict("PENDING", "Pending", "You already asked to join Waco Learning Lab. Status: Pending."),
    );
    renderIt();

    await chooseLab();
    fireEvent.click(screen.getByRole("button", { name: "Send request" }));

    expect(await screen.findByRole("status")).toHaveTextContent("You already asked to join Waco Learning Lab. Status: Pending.");
  });

  it("removes a cancelled request from the memberships (*a)", async () => {
    vi.mocked(cancelMembershipRequest).mockResolvedValue(membership(11, CLINICS, "CANCELLED", "Cancelled"));
    renderIt();

    fireEvent.click(screen.getByRole("button", { name: "Cancel request for Central Texas Clinics" }));

    await vi.waitFor(() => expect(screen.queryByText("Central Texas Clinics")).not.toBeInTheDocument());
    expect(cancelMembershipRequest).toHaveBeenCalledWith("t", 11);
  });

  it("registers a new organization with the request when it is not listed (3a)", async () => {
    vi.mocked(submitMembershipRequest).mockResolvedValue(membership(13, LAB, "PENDING", "Pending"));
    renderIt();

    fireEvent.click(screen.getByRole("button", { name: "Register a new organization" }));
    const form = within(screen.getByRole("region", { name: "Register a new organization" }));
    fireEvent.change(form.getByLabelText("Legal name"), { target: { value: "Waco Learning Lab" } });
    fireEvent.change(form.getByLabelText("Website"), { target: { value: "wacolearning.example" } });
    fireEvent.change(form.getByLabelText("Your role at Waco Learning Lab"), { target: { value: "Recruiter" } });
    fireEvent.change(form.getByLabelText("Why you recruit for them"), { target: { value: "New client." } });
    fireEvent.click(form.getByRole("button", { name: "Send request" }));

    await vi.waitFor(() => expect(submitMembershipRequest).toHaveBeenCalled());
    expect(vi.mocked(submitMembershipRequest).mock.calls[0][1]).toMatchObject({
      organization: { name: "Waco Learning Lab", website: "wacolearning.example" },
      role: "Recruiter",
    });
  });
});
