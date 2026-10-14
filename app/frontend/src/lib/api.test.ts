import {
  BACKEND_TIMEOUT_MS,
  formatDate,
  isOpen,
  searchPostings,
  submitApplicationApi,
  getActiveCountApi,
  type JobPosting,
} from "./api";

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

describe("searchPostings", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("gives the backend a limited time to answer", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const fetch = vi.fn().mockRejectedValue(new Error("timed out"));
    vi.stubGlobal("fetch", fetch);

    await expect(searchPostings()).rejects.toThrow("timed out");

    expect(timeout).toHaveBeenCalledWith(BACKEND_TIMEOUT_MS);
    expect(fetch.mock.calls[0][1].signal).toBe(timeout.mock.results[0].value);
  });
});

describe("submitApplicationApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("posts application to the backend and returns the created application", async () => {
    const mockApp = {
      applicationId: 101,
      jobPostId: 1,
      jobTitle: "Backend Developer",
      organizationName: "Brazos Analytics",
      dateApplied: "2026-10-13",
      applicationStatus: "APPLIED",
      resumeFileName: "resume.pdf",
      activeApplicationCount: 1,
    };
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApp),
    });
    vi.stubGlobal("fetch", fetch);

    const result = await submitApplicationApi(1, "my_cv.pdf");

    expect(result.applicationId).toBe(101);
    expect(result.applicationStatus).toBe("APPLIED");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/postings/1/apply"),
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("getActiveCountApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("fetches active count and limit from the backend", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ activeCount: 2, limit: 5 }),
    });
    vi.stubGlobal("fetch", fetch);

    const result = await getActiveCountApi();

    expect(result.activeCount).toBe(2);
    expect(result.limit).toBe(5);
  });
});
