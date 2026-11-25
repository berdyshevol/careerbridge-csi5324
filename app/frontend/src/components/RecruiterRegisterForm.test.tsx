import { fireEvent, render, screen } from "@testing-library/react";
import {
  AlreadyRegistered,
  OrganizationRegistered,
  RecruiterRegistrationRefused,
  submitRecruiterRegistration,
} from "@/lib/api";
import RecruiterRegisterForm from "./RecruiterRegisterForm";

vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  submitRecruiterRegistration: vi.fn(),
}));

const ORGANIZATION = {
  organizationId: 7,
  name: "Waco Freight Co.",
  website: "wacofreight.example",
  industry: null,
  headquarters: null,
  size: null,
  description: null,
};

function fillAndSend() {
  fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Lee Huang" } });
  fireEvent.change(screen.getByLabelText("Job title"), { target: { value: "HR manager" } });
  fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "lee@wacofreight.example" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Sunrise-2026x" } });
  fireEvent.change(screen.getByLabelText("Legal name"), { target: { value: "Waco Freight Co." } });
  fireEvent.change(screen.getByLabelText("Website"), { target: { value: "wacofreight.example" } });
  fireEvent.click(screen.getByRole("button", { name: "Send for review" }));
}

// UC-08 Register Recruiter and Organization
describe("RecruiterRegisterForm", () => {
  afterEach(() => vi.mocked(submitRecruiterRegistration).mockReset());

  it("sends both parts and then asks the visitor to check their email (step 5)", async () => {
    vi.mocked(submitRecruiterRegistration).mockResolvedValue({
      email: "lee@wacofreight.example",
      organizationName: "Waco Freight Co.",
      joinsExistingOrganization: false,
      verificationLink: null,
    });
    render(<RecruiterRegisterForm />);

    fillAndSend();

    expect(await screen.findByRole("heading", { name: "Check your email" })).toBeInTheDocument();
    expect(screen.getByText(/We sent a link to lee@wacofreight.example/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open the verification link" })).not.toBeInTheDocument();
    expect(submitRecruiterRegistration).toHaveBeenCalledWith(
      { fullName: "Lee Huang", jobTitle: "HR manager", email: "lee@wacofreight.example", phone: "", password: "Sunrise-2026x" },
      expect.objectContaining({ name: "Waco Freight Co.", website: "wacofreight.example" }),
      undefined,
    );
  });

  it("puts each reason next to its field, the organization's included (4a)", async () => {
    vi.mocked(submitRecruiterRegistration).mockRejectedValue(
      new RecruiterRegistrationRefused({ jobTitle: "Job title is required.", "organization.website": "Website is required." }),
    );
    render(<RecruiterRegisterForm />);

    fillAndSend();

    expect(await screen.findByText("Website is required.")).toBeInTheDocument();
    expect(screen.getByLabelText("Website")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Job title")).toHaveAccessibleDescription("Job title is required.");
  });

  it("offers Log In and Join an additional organization for a registered email (4b)", async () => {
    vi.mocked(submitRecruiterRegistration).mockRejectedValue(new AlreadyRegistered("exists"));
    render(<RecruiterRegisterForm />);

    fillAndSend();

    expect(await screen.findByText("An account already exists for this email.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "join an additional organization" })).toHaveAttribute(
      "href",
      "/login?next=/recruiter/organizations",
    );
  });

  it("offers to join a registered organization and sends the request for it (4c)", async () => {
    vi.mocked(submitRecruiterRegistration)
      .mockRejectedValueOnce(new OrganizationRegistered(ORGANIZATION))
      .mockResolvedValueOnce({
        email: "lee@wacofreight.example",
        organizationName: "Waco Freight Co.",
        joinsExistingOrganization: true,
        verificationLink: "/recruiter/verify?token=abc",
      });
    render(<RecruiterRegisterForm />);

    fillAndSend();
    fireEvent.click(await screen.findByRole("button", { name: "Request membership" }));

    expect(await screen.findByRole("heading", { name: "Check your email" })).toBeInTheDocument();
    expect(submitRecruiterRegistration).toHaveBeenLastCalledWith(expect.anything(), null, 7);
    // Without a mail service, the demonstration shows the link the email would carry
    expect(screen.getByRole("link", { name: "Open the verification link" })).toHaveAttribute(
      "href",
      "/recruiter/verify?token=abc",
    );
  });
});
