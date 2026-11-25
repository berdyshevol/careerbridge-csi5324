import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  acceptOffer,
  ApplicationActionRefused,
  declineOffer,
  OfferRevised,
  type ApplicationDetail,
  type OfferSummary,
} from "@/lib/api";
import OfferResponsePanel from "./OfferResponsePanel";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));
vi.mock("@/lib/useEndSession", () => ({
  useEndSession: () => vi.fn(),
}));
vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  acceptOffer: vi.fn(),
  declineOffer: vi.fn(),
}));

const activeOffer: OfferSummary = {
  offerId: 5,
  dateExtended: "2026-10-28",
  startDate: "2027-07-19",
  salary: "$54,000 USD per year",
  terms: "Full-time on-site at our Waco campus.",
  expirationDate: "2027-06-30",
  offerLetterFileName: "Baylor_IT_Offer_Letter.pdf",
  status: "PENDING",
  responseDate: null,
  revision: 1,
  expired: false,
  canRespond: true,
};

describe("OfferResponsePanel", () => {
  afterEach(() => {
    vi.mocked(acceptOffer).mockReset();
    vi.mocked(declineOffer).mockReset();
    refresh.mockReset();
  });

  it("displays offer terms and makes no change when confirmation is cancelled (FR-UC07.1, FR-UC07.3)", async () => {
    const user = userEvent.setup();
    render(
      <OfferResponsePanel
        applicationId={15}
        title="IT Support Specialist"
        organizationName="Baylor IT Services"
        token="t"
        isOfferStage
        offer={activeOffer}
        canAccept
        canDecline
      />,
    );

    expect(screen.getByText(/Offer · respond by Jun 30, 2027/)).toBeInTheDocument();
    expect(screen.getByText("$54,000 USD per year")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Accept offer" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Accept the IT Support Specialist offer?");
    await user.click(screen.getByRole("button", { name: "Go back" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(acceptOffer).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Decline" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Decline the IT Support Specialist offer?");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(declineOffer).not.toHaveBeenCalled();
  });

  it("accepts offer after final confirmation and keeps confirmation visible after refresh (FR-UC07.4)", async () => {
    vi.mocked(acceptOffer).mockResolvedValue({
      application: { applicationStatus: "Hired" } as ApplicationDetail,
      activeApplicationCount: 2,
      applicationLimit: 5,
    });
    const user = userEvent.setup();
    const { rerender } = render(
      <OfferResponsePanel
        applicationId={15}
        title="IT Support Specialist"
        organizationName="Baylor IT Services"
        token="t"
        isOfferStage
        offer={activeOffer}
        canAccept
        canDecline
      />,
    );

    await user.click(screen.getByRole("button", { name: "Accept offer" }));
    await user.click(screen.getByRole("button", { name: "Accept, final" }));

    expect(acceptOffer).toHaveBeenCalledWith("t", 15, 1);
    expect(refresh).toHaveBeenCalled();

    rerender(
      <OfferResponsePanel
        applicationId={15}
        title="IT Support Specialist"
        organizationName="Baylor IT Services"
        token="t"
        isOfferStage={false}
        offer={activeOffer}
        canAccept={false}
        canDecline={false}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/Offer accepted/);
  });

  it("declines offer with optional reason and shows updated active count (FR-UC07.5)", async () => {
    vi.mocked(declineOffer).mockResolvedValue({
      application: { applicationStatus: "Offer Declined" } as ApplicationDetail,
      activeApplicationCount: 1,
      applicationLimit: 5,
    });
    const user = userEvent.setup();
    const { rerender } = render(
      <OfferResponsePanel
        applicationId={15}
        title="IT Support Specialist"
        organizationName="Baylor IT Services"
        token="t"
        isOfferStage
        offer={activeOffer}
        canAccept
        canDecline
      />,
    );

    await user.click(screen.getByRole("button", { name: "Decline" }));
    await user.type(screen.getByLabelText("Reason, optional"), "Accepted another role");
    await user.click(screen.getByRole("button", { name: "Decline, final" }));

    expect(declineOffer).toHaveBeenCalledWith("t", 15, "Accepted another role", 1);
    expect(refresh).toHaveBeenCalled();

    rerender(
      <OfferResponsePanel
        applicationId={15}
        title="IT Support Specialist"
        organizationName="Baylor IT Services"
        token="t"
        isOfferStage={false}
        offer={activeOffer}
        canAccept={false}
        canDecline={false}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("1 of 5 active applications");
  });

  it("shows updated terms and requires fresh confirmation when the offer was revised (FR-UC07.11, ext 6b)", async () => {
    vi.mocked(acceptOffer).mockRejectedValue(
      new OfferRevised("This offer was revised by the recruiter.", {
        ...activeOffer,
        salary: "$60,000 USD per year",
        revision: 2,
      }),
    );
    const user = userEvent.setup();
    render(
      <OfferResponsePanel
        applicationId={15}
        title="IT Support Specialist"
        organizationName="Baylor IT Services"
        token="t"
        isOfferStage
        offer={activeOffer}
        canAccept
        canDecline
      />,
    );

    await user.click(screen.getByRole("button", { name: "Accept offer" }));
    await user.click(screen.getByRole("button", { name: "Accept, final" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("$60,000 USD per year")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/revised by the recruiter/);
  });

  it("shows refusal alert when offer is no longer open (FR-UC07.6, ext 6a)", async () => {
    vi.mocked(acceptOffer).mockRejectedValue(
      new ApplicationActionRefused("The response deadline has passed.", "Offer"),
    );
    const user = userEvent.setup();
    render(
      <OfferResponsePanel
        applicationId={15}
        title="IT Support Specialist"
        organizationName="Baylor IT Services"
        token="t"
        isOfferStage
        offer={activeOffer}
        canAccept
        canDecline
      />,
    );

    await user.click(screen.getByRole("button", { name: "Accept offer" }));
    await user.click(screen.getByRole("button", { name: "Accept, final" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/response deadline has passed/);
    expect(refresh).toHaveBeenCalled();
  });
});

