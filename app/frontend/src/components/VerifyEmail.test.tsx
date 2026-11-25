import { fireEvent, render, screen } from "@testing-library/react";
import { requestNewVerificationLink, VerificationLinkRefused, verifyRecruiterEmail } from "@/lib/api";
import VerifyEmail from "./VerifyEmail";

vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  verifyRecruiterEmail: vi.fn(),
  requestNewVerificationLink: vi.fn(),
}));

// UC-08 steps 6-8 and extension 6a
describe("VerifyEmail", () => {
  afterEach(() => vi.resetAllMocks());

  it("verifies the link once and says the request is under review", async () => {
    vi.mocked(verifyRecruiterEmail).mockResolvedValue();
    render(<VerifyEmail token="abc" />);

    expect(await screen.findByRole("heading", { name: "Your request is under review" })).toBeInTheDocument();
    expect(screen.getByText("The decision will arrive by email.")).toBeInTheDocument();
    expect(verifyRecruiterEmail).toHaveBeenCalledTimes(1);
    expect(verifyRecruiterEmail).toHaveBeenCalledWith("abc");
  });

  it("offers a new link when this one expired", async () => {
    vi.mocked(verifyRecruiterEmail).mockRejectedValue(new VerificationLinkRefused(true, "expired"));
    vi.mocked(requestNewVerificationLink).mockResolvedValue({});
    render(<VerifyEmail token="old" />);

    fireEvent.click(await screen.findByRole("button", { name: "Send a new link" }));

    expect(await screen.findByRole("heading", { name: "Check your email" })).toBeInTheDocument();
    expect(requestNewVerificationLink).toHaveBeenCalledWith("old");
  });

  it("shows the backend's reason for a link never sent or already used", async () => {
    vi.mocked(verifyRecruiterEmail).mockRejectedValue(new VerificationLinkRefused(false, "This link is not valid."));
    render(<VerifyEmail token="used" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("This link is not valid.");
  });
});
