import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ApplicationDetail, ApplicationList, WithdrawalRequest } from "@/lib/api";
import ApplicationsTracker from "./ApplicationsTracker";

const sampleList: ApplicationList = {
  activeApplicationCount: 2,
  applications: [
    {
      applicationId: 2,
      postingId: 3,
      title: "Backend Developer",
      organizationName: "Brazos Analytics",
      location: "Remote",
      employmentType: "Full-time",
      dateApplied: "2026-09-29",
      applicationStatus: "INTERVIEW",
      lastUpdatedDate: "2026-10-08",
      active: true,
    },
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
    {
      applicationId: 9,
      postingId: 6,
      title: "QA Engineer",
      organizationName: "Lone Star Logistics",
      location: "Remote",
      employmentType: "Full-time",
      dateApplied: "2026-09-01",
      applicationStatus: "REJECTED",
      lastUpdatedDate: "2026-09-18",
      active: false,
    },
  ],
};

const interviewDetail: ApplicationDetail = {
  applicationId: 2,
  postingId: 3,
  title: "Backend Developer",
  organizationName: "Brazos Analytics",
  location: "Remote",
  employmentType: "Full-time",
  dateApplied: "2026-09-29",
  applicationStatus: "INTERVIEW",
  lastUpdatedDate: "2026-10-08",
  rejectionReason: null,
  rejectedAtStage: null,
  rejectionDate: null,
  withdrawnAt: null,
  withdrawalReason: null,
  statusHistory: [
    { status: "APPLIED", date: "2026-09-29", reason: null },
    { status: "SCREENING", date: "2026-10-03", reason: null },
    { status: "INTERVIEW", date: "2026-10-08", reason: null },
  ],
  interviews: [
    {
      interviewId: 1,
      scheduledTime: "2026-10-15T14:00:00",
      format: "Video call",
      location: "Video link sent by email",
    },
  ],
  offer: null,
  availableActions: ["WITHDRAW"],
  activeApplicationCount: 2,
};

const rejectedDetail: ApplicationDetail = {
  ...interviewDetail,
  applicationId: 9,
  postingId: 6,
  title: "QA Engineer",
  organizationName: "Lone Star Logistics",
  applicationStatus: "REJECTED",
  rejectionReason: "Posting closed",
  rejectedAtStage: "SCREENING",
  rejectionDate: "2026-09-18",
  statusHistory: [
    { status: "APPLIED", date: "2026-09-01", reason: null },
    { status: "SCREENING", date: "2026-09-10", reason: null },
    { status: "REJECTED", date: "2026-09-18", reason: "Posting closed" },
  ],
  interviews: [],
  availableActions: [],
};

const withdrawalPreview: WithdrawalRequest = {
  applicationId: 2,
  postingId: 3,
  title: "Backend Developer",
  organizationName: "Brazos Analytics",
  applicationStatus: "INTERVIEW",
  warning:
    "Withdrawal is final and cannot be undone. You cannot apply to this posting again after withdrawing.",
};

function stubTrackerFetch(overrides?: {
  onWithdraw?: () => Response | Promise<Response>;
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
    if (url.endsWith("/api/applications/2")) {
      return Promise.resolve(
        new Response(JSON.stringify(interviewDetail), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    if (url.endsWith("/api/applications/9")) {
      return Promise.resolve(
        new Response(JSON.stringify(rejectedDetail), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    if (url.endsWith("/api/applications/2/withdrawal")) {
      return Promise.resolve(
        new Response(JSON.stringify(withdrawalPreview), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    if (url.endsWith("/api/applications/2/withdraw") && init?.method === "POST") {
      if (overrides?.onWithdraw) {
        return Promise.resolve(overrides.onWithdraw());
      }
      const withdrawn: ApplicationDetail = {
        ...interviewDetail,
        applicationStatus: "WITHDRAWN",
        withdrawnAt: "2026-10-14T15:30:00Z",
        withdrawalReason: "Accepted another offer",
        availableActions: [],
        activeApplicationCount: 1,
        statusHistory: [
          ...interviewDetail.statusHistory,
          { status: "WITHDRAWN", date: "2026-10-14", reason: "Accepted another offer" },
        ],
      };
      return Promise.resolve(
        new Response(JSON.stringify(withdrawn), {
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

describe("ApplicationsTracker (UC-05 and UC-06)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists applications with active ones first, filters them, and shows stage history and interview details (FR-UC05.1–5.3, FR-UC05.7, FR-UC05.8)", async () => {
    stubTrackerFetch();
    const user = userEvent.setup();
    render(<ApplicationsTracker />);

    expect(await screen.findByRole("heading", { level: 2, name: "Backend Developer" })).toBeInTheDocument();
    expect(screen.getByText("2 of 5 active", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Video call · Video link sent by email")).toBeInTheDocument();

    // Filter to closed applications (FR-UC05.7)
    await user.click(screen.getByRole("button", { name: /Closed \(1\)/ }));
    expect(screen.getByText("QA Engineer")).toBeInTheDocument();
    expect(screen.queryByText("IT Support Specialist")).not.toBeInTheDocument();

    // View rejected application details (FR-UC05.4)
    await user.click(screen.getByRole("button", { name: "View history" }));
    expect(await screen.findByText(/Reason: Posting closed/)).toBeInTheDocument();
  });

  it("warns that withdrawal is final, requires confirmation, and updates active count on withdrawal (UC-06, FR-UC06.1–6.6)", async () => {
    const fetch = stubTrackerFetch();
    const user = userEvent.setup();
    render(<ApplicationsTracker />);

    const withdrawButton = await screen.findByRole("button", { name: "Withdraw application" });
    await user.click(withdrawButton);

    expect(await screen.findByText(/Withdrawal is final and cannot be undone/)).toBeInTheDocument();
    const confirmButton = screen.getByRole("button", { name: "Confirm withdrawal" });
    expect(confirmButton).toBeDisabled();

    await user.selectOptions(screen.getByLabelText(/Reason for withdrawing/), "Accepted another offer");
    await user.click(screen.getByRole("checkbox"));
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    expect(await screen.findByText(/You now have 1 of 5 active applications/)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/applications/2/withdraw"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows the backend's refusal if withdrawal is rejected (ADR-0006, extensions 4a-4b)", async () => {
    stubTrackerFetch({
      onWithdraw: () =>
        new Response("Saving is switched off on the public site until users can log in.", {
          status: 403,
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
        }),
    });
    const user = userEvent.setup();
    render(<ApplicationsTracker />);

    await user.click(await screen.findByRole("button", { name: "Withdraw application" }));
    await user.click(await screen.findByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Confirm withdrawal" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Saving is switched off");
  });
});

