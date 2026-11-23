import { render, screen } from "@testing-library/react";
import RecruiterRequestQueue from "./RecruiterRequestQueue";

// UC-10 step 2 and extension 2a
describe("RecruiterRequestQueue", () => {
  it("says so when the queue is empty", () => {
    render(<RecruiterRequestQueue requests={[]} />);

    expect(screen.getByText("No pending requests.")).toBeInTheDocument();
  });

  it("shows each request's type, requester, organization, date and review flag, linking to it", () => {
    render(
      <RecruiterRequestQueue
        requests={[
          {
            requestId: 4,
            requestType: "NEW_RECRUITER_NEW_ORGANIZATION",
            requestTypeLabel: "New recruiter, new organization",
            requesterName: "Lee Huang",
            organizationName: "Waco Freight Co.",
            requestedAt: "2026-10-28T15:00:00Z",
            status: "INFORMATION_REQUESTED",
            statusLabel: "Information Requested",
            reviewFlag: "Work email domain does not match the organization's website",
          },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: /Lee Huang/ })).toHaveAttribute("href", "/admin/requests/4");
    expect(screen.getByText("New recruiter, new organization")).toBeInTheDocument();
    expect(screen.getByText("Waco Freight Co.")).toBeInTheDocument();
    expect(screen.getByText("Submitted Oct 28, 2026")).toBeInTheDocument();
    expect(screen.getByText("Flagged")).toBeInTheDocument();
    expect(screen.getByText("Information requested")).toBeInTheDocument();
  });
});
