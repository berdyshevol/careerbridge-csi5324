import {
  AlreadyRegistered,
  decideRecruiterRequest,
  MembershipConflict,
  OrganizationRegistered,
  RecruiterRegistrationRefused,
  SessionEnded,
  submitMembershipRequest,
  submitRecruiterRegistration,
  VerificationLinkRefused,
  verifyRecruiterEmail,
} from "./api";

afterEach(() => vi.unstubAllGlobals());

function answer(status: number, body: unknown) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
    new Response(typeof body === "string" ? body : JSON.stringify(body), {
      status,
      headers: { "Content-Type": typeof body === "string" ? "text/plain" : "application/json" },
    }),
  ));
}

const RECRUITER = { fullName: "Lee Huang", jobTitle: "HR", email: "lee@x.example", phone: "", password: "Sunrise-2026x" };
const ORGANIZATION = { name: "X", website: "x.example", industry: "", headquarters: "", size: "", description: "" };

// UC-08, UC-09 and UC-10: each refusal of the backend becomes its own error
describe("recruiter and membership calls", () => {
  it("reads the organization's field errors (UC-08 4a)", async () => {
    answer(400, { "organization.website": "Website is required." });

    const refused = await submitRecruiterRegistration(RECRUITER, ORGANIZATION).catch((err) => err);

    expect(refused).toBeInstanceOf(RecruiterRegistrationRefused);
    expect(refused.fieldErrors).toEqual({ "organization.website": "Website is required." });
  });

  it("tells a registered email from a registered organization (UC-08 4b, 4c)", async () => {
    answer(409, { reason: "EMAIL_REGISTERED", message: "An account already exists." });
    await expect(submitRecruiterRegistration(RECRUITER, ORGANIZATION)).rejects.toBeInstanceOf(AlreadyRegistered);

    answer(409, { reason: "ORGANIZATION_REGISTERED", message: "Registered.", organization: { organizationId: 3, name: "X Inc" } });
    const offered = await submitRecruiterRegistration(RECRUITER, ORGANIZATION).catch((err) => err);
    expect(offered).toBeInstanceOf(OrganizationRegistered);
    expect(offered.organization.organizationId).toBe(3);
  });

  it("knows an expired link from one never sent (UC-08 6a)", async () => {
    answer(410, { expired: true, message: "This link has expired." });
    const expired = await verifyRecruiterEmail("t").catch((err) => err);
    expect(expired).toBeInstanceOf(VerificationLinkRefused);
    expect(expired.expired).toBe(true);
  });

  it("carries the existing status of a membership conflict (UC-09 6a, 6b; UC-10 6a)", async () => {
    answer(409, { status: "PENDING", statusLabel: "Pending", message: "You already asked. Status: Pending." });
    const pending = await submitMembershipRequest("t", { organizationId: 1, role: "R", justification: "J" }).catch((err) => err);
    expect(pending).toBeInstanceOf(MembershipConflict);
    expect(pending.status).toBe("PENDING");

    answer(409, { status: "ACTIVE", statusLabel: "Active", message: "This request is now Approved. Nothing was changed." });
    const decided = await decideRecruiterRequest("t", 1, "approve").catch((err) => err);
    expect(decided).toBeInstanceOf(MembershipConflict);
    expect(decided.message).toBe("This request is now Approved. Nothing was changed.");
  });

  it("ends the session when the backend refuses the role (UC-10 FR-UC10.1)", async () => {
    answer(403, "");
    await expect(decideRecruiterRequest("t", 1, "approve")).rejects.toBeInstanceOf(SessionEnded);
  });

  it("gives a denial's missing reason as the message (UC-10 5a)", async () => {
    answer(400, { reason: "A reason is required." });
    await expect(decideRecruiterRequest("t", 1, "deny")).rejects.toThrow("A reason is required.");
  });
});
