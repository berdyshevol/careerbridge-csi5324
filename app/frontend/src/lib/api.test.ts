import {
  BACKEND_TIMEOUT_MS,
  createPosting,
  formatDate,
  isOpen,
  PostingRejected,
  searchPostings,
  submitApplication,
  viewApplications,
  ApplicationRefused,
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

describe("viewApplications", () => {
  const answer = {
    applicationId: 3,
    postingId: 1,
    title: "Junior Software Engineer",
    organizationName: "Brazos Analytics",
    location: "Hybrid",
    employmentType: "Full-time",
    applicationStatus: "APPLIED",
  };

  it("returns the active applications with their stage named as on the screen", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([answer, { ...answer, applicationId: 2, postingId: 3, applicationStatus: "INTERVIEW" }]),
    });
    vi.stubGlobal("fetch", fetch);

    const applications = await viewApplications();

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/applicant/applications"), expect.anything());
    expect(applications.active.map((a) => a.applicationStatus)).toEqual(["Applied", "Interview"]);
    expect(applications.active[0]).toMatchObject({ applicationId: 3, postingId: 1, title: "Junior Software Engineer" });
  });

  it("keeps an ended application out of the active ones but remembers its posting (A5)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([answer, { ...answer, applicationId: 4, postingId: 7, applicationStatus: "WITHDRAWN" }]),
      }),
    );

    const applications = await viewApplications();

    expect(applications.active.map((a) => a.postingId)).toEqual([1]);
    expect(applications.appliedPostingIds).toEqual([1, 7]);
  });

  it("fails when the backend does not answer well", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(viewApplications()).rejects.toThrow("500");
  });
});
