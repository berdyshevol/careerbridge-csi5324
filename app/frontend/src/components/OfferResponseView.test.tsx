import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ApplicationList, JobOffer, OfferDecision } from "@/lib/api";
import OfferResponseView from "./OfferResponseView";

const sampleList: ApplicationList = {
  activeApplicationCount: 3,
  applications: [
    {
      applicationId: 1,
      postingId: 4,
      title: "IT Support Specialist",
      organizationName: "Waco Health Partners",
      location: "On-site",
      employmentType: "Part-time",
      dateApplied: "2026-09-22",
      applicationStatus: "OFFER",
      lastUpdatedDate: "2026-10-06",
      active: true,
    },
  ],
};

const sampleOffer: JobOffer = {
  offerId: 1,
  applicationId: 1,
  postingId: 4,
  title: "IT Support Specialist",
  organizationName: "Waco Health Partners",
  location: "On-site",
  employmentType: "Part-time",
  applicationStatus: "OFFER",
  dateExtended: "2026-10-06",
  expirationDate: "2026-12-10",
  startDate: "2027-01-11",
  salary: "$25 per hour",
  terms: "Part-time, 20 hours per week on-site at Clinic A.",
  status: "EXTENDED",
  responseDate: null,
  open: true,
};

function stubOfferFetch(overrides?: {
  onAccept?: () => Response | Promise<Response>;
  onDecline?: () => Response | Promise<Response>;
}) {
  const fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    if (url.endsWith("/api/applications")) {
      return Promise.resolve(
        new Response(JSON.stringify(sampleList), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    if (url.endsWith("/api/applications/1/offer")) {
      return Promise.resolve(
        new Response(JSON.stringify(sampleOffer), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    if (url.endsWith("/api/applications/1/offer/accept") && init?.method === "POST") {
      if (overrides?.onAccept) {
        return Promise.resolve(overrides.onAccept());
      }
      const decision: OfferDecision = {
        applicationId: 1,
        applicationStatus: "HIRED",
        offerStatus: "ACCEPTED",
        responseDate: "2026-10-14",
        postingClosed: true,
        activeApplicationCount: 2,
      };
      return Promise.resolve(
        new Response(JSON.stringify(decision), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    if (url.endsWith("/api/applications/1/offer/decline") && init?.method === "POST") {
      if (overrides?.onDecline) {
        return Promise.resolve(overrides.onDecline());
      }
      const decision: OfferDecision = {
        applicationId: 1,
        applicationStatus: "OFFER_DECLINED",
        offerStatus: "DECLINED",
        responseDate: "2026-10-14",
        postingClosed: false,
        activeApplicationCount: 2,
      };
      return Promise.resolve(
        new Response(JSON.stringify(decision), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

describe("OfferResponseView (UC-07)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the offer terms, requires confirmation to accept, and confirms Hired and posting closure (FR-UC07.1–7.4, FR-UC07.7)", async () => {
    stubOfferFetch();
    const user = userEvent.setup();
    render(<OfferResponseView />);

    expect(await screen.findByRole("heading", { level: 1, name: "IT Support Specialist" })).toBeInTheDocument();
    expect(screen.getByText("$25 per hour")).toBeInTheDocument();
    expect(screen.getByText(/20 hours per week/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Accept offer" }));
    const confirmAccept = screen.getByRole("button", { name: "Confirm acceptance" });
    expect(confirmAccept).toBeDisabled();

    await user.click(screen.getByRole("checkbox"));
    expect(confirmAccept).toBeEnabled();
    await user.click(confirmAccept);

    expect(await screen.findByRole("heading", { level: 1, name: "Offer accepted" })).toBeInTheDocument();
    expect(screen.getByText(/2 of 5 active applications/)).toBeInTheDocument();
    expect(screen.getByText(/filled the last opening/)).toBeInTheDocument();
  });

  it("lets the applicant decline an offer with an optional reason after confirmation (FR-UC07.2, FR-UC07.3, FR-UC07.5)", async () => {
    const fetch = stubOfferFetch();
    const user = userEvent.setup();
    render(<OfferResponseView />);

    await user.click(await screen.findByRole("button", { name: "Decline offer" }));
    const confirmDecline = screen.getByRole("button", { name: "Confirm decline" });
    expect(confirmDecline).toBeDisabled();

    await user.selectOptions(screen.getByLabelText(/Reason for declining/), "Accepted another offer");
    await user.click(screen.getByRole("checkbox"));
    await user.click(confirmDecline);

    expect(await screen.findByRole("heading", { level: 1, name: "Offer declined" })).toBeInTheDocument();
    expect(screen.getByText(/Offer Declined stage/)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/applications/1/offer/decline"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("cancels without recording a decision when the applicant backs out (FR-UC07.3, extension 5a)", async () => {
    const fetch = stubOfferFetch();
    const user = userEvent.setup();
    render(<OfferResponseView />);

    await user.click(await screen.findByRole("button", { name: "Accept offer" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("button", { name: "Accept offer" })).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/offer/accept"),
      expect.anything(),
    );
  });
});

