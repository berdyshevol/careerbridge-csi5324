import {
  BACKEND_TIMEOUT_MS,
  createPosting,
  formatDate,
  isOpen,
  PostingRejected,
  searchPostings,
  searchCriteria,
  searchQuery,
  startApplication,
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
    closesAt: "3000-01-01T05:59:00Z",
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
    expect(isOpen(posting({ closesAt: "2000-01-02T05:59:00Z" }))).toBe(false);
  });

  it("is false for a closed posting", () => {
    expect(isOpen(posting({ postStatus: "CLOSED" }))).toBe(false);
  });

  // 23:59 on Oct 17 in Chicago is 04:59Z on Oct 18 (UC-13 variation 2a)
  it("stays open until the closing minute the backend sends and closes at it (UC-13)", () => {
    vi.useFakeTimers();
    const job = posting({ closesAt: "2026-10-18T04:59:00Z" });

    vi.setSystemTime(new Date("2026-10-18T04:58:59Z"));
    expect(isOpen(job)).toBe(true);

    vi.setSystemTime(new Date("2026-10-18T04:59:00Z"));
    expect(isOpen(job)).toBe(false);
  });

  it("is false when the posting has no closing moment", () => {
    expect(isOpen(posting({ closesAt: null }))).toBe(false);
  });
});

describe("formatDate", () => {
  it("shows the calendar day that was stored, whatever the time zone", () => {
    expect(formatDate("2026-12-20")).toBe("Dec 20, 2026");
  });
});

describe("searchCriteria", () => {
  it("takes the first value of a key the link repeats", () => {
    expect(searchCriteria({ location: ["Remote", "Hybrid"], keyword: "java", page: "2" })).toEqual({
      keyword: "java",
      location: "Remote",
      employmentType: undefined,
    });
  });
});

describe("searchQuery", () => {
  it("keeps only the criteria the visitor filled in", () => {
    expect(searchQuery({ keyword: " java ", location: "", employmentType: "Internship" })).toBe(
      "?keyword=java&employmentType=Internship",
    );
  });

  it("is empty when nothing was chosen", () => {
    expect(searchQuery({})).toBe("");
  });
});

describe("searchPostings", () => {
  it("asks the backend with every chosen criterion", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetch);

    await searchPostings({ keyword: "data", location: "On-site", organization: "Waco Health", employmentType: "Full-time" });

    expect(fetch.mock.calls[0][0]).toBe(
      "http://localhost:8080/api/postings?keyword=data&location=On-site&organization=Waco+Health&employmentType=Full-time",
    );
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

describe("startApplication", () => {
  const resume = { fileName: "cv.pdf", fileType: "application/pdf", fileSize: 2048 };
  const summary = {
    posting: { postingId: 2, title: "Data Analyst Intern", organizationName: "Waco Health Partners" },
    activeApplicationCount: 3,
    applicationLimit: 5,
    refusal: null,
  };

  it("reads the summary with the resume on file in the query (STAND-IN until UC-03)", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(summary) });
    vi.stubGlobal("fetch", fetch);

    await expect(startApplication(2, resume)).resolves.toEqual(summary);
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.pathname).toBe("/api/postings/2/application");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      resumeFileName: "cv.pdf",
      resumeFileType: "application/pdf",
      resumeFileSize: "2048",
    });
  });

  it("sends no resume when none is on file, so the backend names the refusal", async () => {
    const refused = { ...summary, refusal: { reason: "NO_RESUME", message: "A resume is required to apply." } };
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(refused) });
    vi.stubGlobal("fetch", fetch);

    const start = await startApplication(2, null);
    expect(new URL(fetch.mock.calls[0][0]).search).toBe("");
    expect(start.refusal?.reason).toBe("NO_RESUME");
  });

  it("fails when the backend does not answer", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(startApplication(2, resume)).rejects.toThrow("Backend answered 500");
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
      expect.stringContaining("/api/postings/2/application"),
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

  it("turns a 409 into ApplicationRefused with the backend's reason", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        headers: new Headers({ "Content-Type": "application/json" }),
        json: () => Promise.resolve({ reason: "LIMIT_REACHED", message: "You have 5 active applications." }),
      }),
    );

    const refused = await submitApplication(2, resume).catch((error) => error);
    expect(refused).toBeInstanceOf(ApplicationRefused);
    expect(refused.message).toBe("You have 5 active applications.");
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
