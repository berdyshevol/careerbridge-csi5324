import {
  acceptOffer,
  ApplicationRefused,
  BACKEND_TIMEOUT_MS,
  createPosting,
  declineOffer,
  formatDate,
  formatStage,
  isOpen,
  PostingRejected,
  requestWithdrawal,
  searchPostings,
  submitApplication,
  viewApplication,
  viewApplications,
  viewOffer,
  withdrawApplication,
  type JobPosting,
  type NewPosting,
} from "./api";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function posting(overrides: Partial<JobPosting>): JobPosting {
  return {
    jobPostId: 1,
    title: "Backend Developer",
    description: "",
    jobRequirements: "",
    location: "Remote",
    employmentType: "Full-time",
    salaryRange: null,
    numberOfOpenings: 1,
    datePosted: "2026-10-05",
    applicationDeadline: "2999-12-31",
    postStatus: "PUBLISHED",
    organization: { organizationId: 1, name: "Brazos Analytics" },
    ...overrides,
  };
}

describe("isOpen", () => {
  it("is true for a published posting before its deadline", () => {
    expect(isOpen(posting({}))).toBe(true);
  });

  it("is false once the deadline has passed", () => {
    expect(isOpen(posting({ applicationDeadline: "2000-01-01" }))).toBe(false);
  });

  it("is false for a closed posting", () => {
    expect(isOpen(posting({ postStatus: "CLOSED" }))).toBe(false);
  });
});

describe("formatDate", () => {
  it("shows the calendar day that was stored, whatever the time zone", () => {
    expect(formatDate("2026-12-20")).toBe("Dec 20, 2026");
  });
});

describe("formatStage", () => {
  it("formats backend enum codes into display stage names", () => {
    expect(formatStage("APPLIED")).toBe("Applied");
    expect(formatStage("OFFER_DECLINED")).toBe("Offer Declined");
    expect(formatStage("HIRED")).toBe("Hired");
  });
});

describe("searchPostings", () => {
  it("gives the backend a limited time to answer", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const fetch = vi.fn().mockRejectedValue(new Error("timed out"));
    vi.stubGlobal("fetch", fetch);

    await expect(searchPostings()).rejects.toThrow("timed out");

    expect(timeout).toHaveBeenCalledWith(BACKEND_TIMEOUT_MS);
    expect(fetch.mock.calls[0][1].signal).toBe(timeout.mock.results[0].value);
  });
});

describe("createPosting", () => {
  const newPosting: NewPosting = {
    organizationId: 1,
    title: "Backend Developer",
    description: "",
    jobRequirements: "",
    location: "Remote",
    employmentType: "Full-time",
    salaryRange: null,
    numberOfOpenings: 1,
    applicationDeadline: "2999-12-31",
  };

  function answer(status: number, body: string, contentType: string) {
    const fetch = vi.fn().mockResolvedValue(
      new Response(body, { status, headers: { "Content-Type": contentType } }),
    );
    vi.stubGlobal("fetch", fetch);
    return fetch;
  }

  it("posts the posting and returns the one the backend saved", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const saved = posting({ postStatus: "DRAFT" });
    const fetch = answer(201, JSON.stringify(saved), "application/json");

    await expect(createPosting(newPosting)).resolves.toEqual(saved);

    const [url, init] = fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/postings$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual(newPosting);
    expect(init.signal).toBe(timeout.mock.results[0].value);
  });

  it.each([
    [400, "Job title is required"],
    [403, "Saving is switched off"],
  ])("passes on the reason when the backend refuses the posting: %i", async (status, reason) => {
    answer(status, reason, "text/plain;charset=UTF-8");

    const refused = await createPosting(newPosting).catch((error) => error);

    expect(refused).toBeInstanceOf(PostingRejected);
    expect(refused.message).toBe(reason);
  });

  it.each([
    [500, "a server error"],
    [400, "a request the backend could not read"],
  ])("keeps the backend's own error report off the screen: %i, %s", async (status) => {
    answer(status, '{"status":' + status + ',"path":"/api/postings"}', "application/json");

    const failed = await createPosting(newPosting).catch((error) => error);

    expect(failed).not.toBeInstanceOf(PostingRejected);
    expect(failed.message).not.toContain("path");
  });
});

describe("submitApplication", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const resume = { fileName: "cv.pdf", fileType: "application/pdf", fileSize: 2048 };

  it("posts the resume on file and returns the backend's answer", async () => {
    const answer = { applicationId: 7, applicationStatus: "APPLIED", activeApplicationCount: 4 };
    const fetch = vi.fn().mockResolvedValue({ ok: true, headers: new Headers(), json: () => Promise.resolve(answer) });
    vi.stubGlobal("fetch", fetch);

    await expect(submitApplication(2, resume)).resolves.toEqual(answer);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/postings/2/apply"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("sends no resume when none is on file, so the backend can refuse", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, headers: new Headers(), json: () => Promise.resolve({}) });
    vi.stubGlobal("fetch", fetch);

    await submitApplication(2, null);
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({});
  });

  it("turns a plain-text refusal into ApplicationRefused with the backend's reason", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers({ "Content-Type": "text/plain" }),
        text: () => Promise.resolve("You already applied to this posting."),
      }),
    );

    const refused = await submitApplication(2, resume).catch((error) => error);
    expect(refused).toBeInstanceOf(ApplicationRefused);
    expect(refused.message).toBe("You already applied to this posting.");
  });
});

describe("UC-05, UC-06 and UC-07 API operations", () => {
  it("fetches applications and application details (CO-05.1, CO-05.2)", async () => {
    const list = { applications: [], activeApplicationCount: 0 };
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve(list),
    });
    vi.stubGlobal("fetch", fetch);

    await expect(viewApplications()).resolves.toEqual(list);
    expect(fetch.mock.calls[0][0]).toContain("/api/applications");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers(),
      }),
    );
    await expect(viewApplication(99)).resolves.toBeNull();
  });

  it("requests and submits a withdrawal (CO-06.1, CO-06.2)", async () => {
    const preview = {
      applicationId: 2,
      postingId: 3,
      title: "Backend Developer",
      organizationName: "Brazos Analytics",
      applicationStatus: "INTERVIEW",
      warning: "Withdrawal is final.",
    };
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve(preview),
    });
    vi.stubGlobal("fetch", fetch);

    await expect(requestWithdrawal(2)).resolves.toEqual(preview);

    await withdrawApplication(2, "Accepted another offer");
    expect(fetch.mock.calls[1][0]).toContain("/api/applications/2/withdraw");
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ reason: "Accepted another offer" });
  });

  it("views, accepts and declines a job offer (CO-07.1, CO-07.2, CO-07.3)", async () => {
    const offer = {
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
      terms: "20 hours per week",
      status: "EXTENDED",
      responseDate: null,
      open: true,
    };
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve(offer),
    });
    vi.stubGlobal("fetch", fetch);

    await expect(viewOffer(1)).resolves.toEqual(offer);
    await acceptOffer(1, { expectedSalary: "$25 per hour", expectedExpirationDate: "2026-12-10" });
    expect(fetch.mock.calls[1][0]).toContain("/api/applications/1/offer/accept");

    await declineOffer(1, "No longer interested");
    expect(fetch.mock.calls[2][0]).toContain("/api/applications/1/offer/decline");
    expect(JSON.parse(fetch.mock.calls[2][1].body)).toEqual({ reason: "No longer interested" });
  });
});
