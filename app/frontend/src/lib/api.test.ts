import { SessionEnded,
  BACKEND_TIMEOUT_MS,
  createPosting,
  formatDate,
  formatUtcDay,
  isOpen,
  PostingRejected,
  searchPostings,
  searchCriteria,
  searchQuery,
  startApplication,
  submitApplication,
  viewApplications,
  updateProfile,
  viewProfile,
  ApplicationRefused,
  ProfileRefused,
  ResumeRefused,
  uploadResume,
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

describe("formatUtcDay", () => {
  it("shows the day of a UTC moment where the user is", () => {
    const moment = "2026-10-28T04:30:00";
    expect(formatUtcDay(moment)).toBe(
      new Date(Date.UTC(2026, 9, 28, 4, 30)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    );
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

    await expect(createPosting("t", newPosting)).resolves.toEqual(saved);

    const [url, init] = fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/postings$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual(newPosting);
    expect(init.signal).toBe(timeout.mock.results[0].value);
  });

  it("passes on the reason when the backend refuses the posting", async () => {
    answer(400, "Job title is required", "text/plain;charset=UTF-8");

    const refused = await createPosting("t", newPosting).catch((error) => error);

    expect(refused).toBeInstanceOf(PostingRejected);
    expect(refused.message).toBe("Job title is required");
  });

  it.each([401, 403])("ends the session when the backend refuses the token: %i", async (status) => {
    answer(status, "", "application/json");

    await expect(createPosting("t", newPosting)).rejects.toBeInstanceOf(SessionEnded);
  });

  it.each([
    [500, "a server error"],
    [400, "a request the backend could not read"],
  ])("keeps the backend's own error report off the screen: %i, %s", async (status) => {
    answer(status, '{"status":' + status + ',"path":"/api/postings"}', "application/json");

    const failed = await createPosting("t", newPosting).catch((error) => error);

    expect(failed).not.toBeInstanceOf(PostingRejected);
    expect(failed.message).not.toContain("path");
  });
});

describe("startApplication", () => {
  const summary = {
    posting: { postingId: 2, title: "Data Analyst Intern", organizationName: "Waco Health Partners" },
    resume: { fileName: "cv.pdf", uploadDate: "2026-10-01T09:30:00" },
    activeApplicationCount: 3,
    applicationLimit: 5,
    refusal: null,
  };

  it("reads the summary with the resume the backend has on file, sending none itself", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(summary) });
    vi.stubGlobal("fetch", fetch);

    await expect(startApplication("t", 2)).resolves.toEqual(summary);
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.pathname).toBe("/api/postings/2/application");
    expect(url.search).toBe("");
    expect(fetch.mock.calls[0][1].headers).toEqual({ Authorization: "Bearer t" });
  });

  it("passes on the backend's refusal when no resume is on file (extension 2a)", async () => {
    const refused = {
      ...summary,
      resume: null,
      refusal: { reason: "NO_RESUME", message: "A resume is required to apply." },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(refused) }));

    const start = await startApplication("t", 2);
    expect(start.resume).toBeNull();
    expect(start.refusal?.reason).toBe("NO_RESUME");
  });

  it("fails when the backend does not answer", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(startApplication("t", 2)).rejects.toThrow("Backend answered 500");
  });
});

describe("submitApplication", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts without a body, as the backend copies the resume on file, and returns its answer", async () => {
    const answer = { applicationId: 7, applicationStatus: "APPLIED", activeApplicationCount: 4 };
    const fetch = vi.fn().mockResolvedValue({ ok: true, headers: new Headers(), json: () => Promise.resolve(answer) });
    vi.stubGlobal("fetch", fetch);

    await expect(submitApplication("t", 2)).resolves.toEqual(answer);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/postings/2/application"),
      expect.objectContaining({ method: "POST", headers: { Authorization: "Bearer t" } }),
    );
    expect(fetch.mock.calls[0][1].body).toBeUndefined();
  });

  it("turns the no-resume refusal into ApplicationRefused with the backend's reason (extension 2a)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        headers: new Headers({ "Content-Type": "application/json" }),
        json: () => Promise.resolve({ reason: "NO_RESUME", message: "A resume is required to apply." }),
      }),
    );

    const refused = await submitApplication("t", 2).catch((error) => error);
    expect(refused).toBeInstanceOf(ApplicationRefused);
    expect(refused.message).toBe("A resume is required to apply.");
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

    const refused = await submitApplication("t", 2).catch((error) => error);
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

    const refused = await submitApplication("t", 2).catch((error) => error);
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

    const applications = await viewApplications("t");

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

    const applications = await viewApplications("t");

    expect(applications.active.map((a) => a.postingId)).toEqual([1]);
    expect(applications.appliedPostingIds).toEqual([1, 7]);
  });

  it("fails when the backend does not answer well", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(viewApplications("t")).rejects.toThrow("500");
  });
});

describe("viewProfile", () => {
  const profile = {
    firstName: "Jordan",
    lastName: "Lee",
    email: "jordan.lee@example.com",
    phone: "(254) 555-0142",
    location: null,
    headline: null,
    skills: null,
    education: null,
    workExperience: null,
    resume: { fileName: "Jordan_Lee_CV.pdf", uploadDate: "2026-10-01T09:30:00" },
  };

  it("asks for the logged-in applicant's own profile with their token", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(profile) });
    vi.stubGlobal("fetch", fetch);

    await expect(viewProfile("t")).resolves.toEqual(profile);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/applicant/profile"),
      expect.objectContaining({ headers: { Authorization: "Bearer t" } }),
    );
  });

  it("ends the session when the backend refuses the token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));

    await expect(viewProfile("t")).rejects.toBeInstanceOf(SessionEnded);
  });

  it("fails when the backend does not answer well", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(viewProfile("t")).rejects.toThrow("500");
  });
});

describe("updateProfile", () => {
  const details = {
    firstName: "Jordan",
    lastName: "Lee",
    phone: "(254) 555-0199",
    location: "Waco, TX",
    headline: "Data analyst",
    skills: "",
    education: "",
    workExperience: "",
  };

  function answer(status: number, body: unknown) {
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  }

  it("sends every detail of the form with the applicant's token and answers with the saved profile", async () => {
    const saved = { ...details, email: "jordan.lee@example.com", skills: null, education: null, workExperience: null, resume: null };
    const fetch = vi.fn().mockResolvedValue(answer(200, saved));
    vi.stubGlobal("fetch", fetch);

    await expect(updateProfile("t", details)).resolves.toEqual(saved);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toContain("/api/applicant/profile");
    expect(init.method).toBe("PUT");
    expect(init.headers).toEqual({ Authorization: "Bearer t", "Content-Type": "application/json" });
    expect(JSON.parse(init.body)).toEqual(details);
  });

  it("hands over the reason for each refused field (UC-03 extension 4a)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(answer(400, {
      firstName: "Enter your first name.",
      phone: "Enter a phone number like (254) 555-0142.",
    })));

    const refused = await updateProfile("t", details).catch((err) => err);
    expect(refused).toBeInstanceOf(ProfileRefused);
    expect(refused.fieldErrors).toEqual({
      firstName: "Enter your first name.",
      phone: "Enter a phone number like (254) 555-0142.",
    });
  });

  it("keeps Spring's own 400 report off the screen", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(answer(400, { status: 400, error: "Bad Request", path: "/x" })));

    await expect(updateProfile("t", details)).rejects.toThrow("Backend answered 400");
  });

  it("ends the session when the backend refuses the token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    await expect(updateProfile("t", details)).rejects.toBeInstanceOf(SessionEnded);
  });
});

describe("uploadResume", () => {
  const file = new File(["%PDF-1.4"], "Pat_Kim_CV.pdf", { type: "application/pdf" });

  it("sends the file as multipart with the applicant's token and answers with the resume on file", async () => {
    const onFile = { fileName: "Pat_Kim_CV.pdf", uploadDate: "2026-10-27T14:05:00" };
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(onFile), { status: 201, headers: { "Content-Type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetch);

    await expect(uploadResume("t", file)).resolves.toEqual(onFile);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toContain("/api/applicant/resume");
    expect(init.method).toBe("POST");
    // No Content-Type of our own: the browser adds multipart/form-data with its boundary
    expect(init.headers).toEqual({ Authorization: "Bearer t" });
    expect((init.body as FormData).get("file")).toBe(file);
  });

  it("hands over the backend's reason for a refused file (UC-03 extension 6a)", async () => {
    const reason = "The file is not a PDF or DOCX. Choose a PDF or DOCX file of at most 5 MB.";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(reason, { status: 400, headers: { "Content-Type": "text/plain;charset=UTF-8" } }),
    ));

    const refused = await uploadResume("t", file).catch((err) => err);
    expect(refused).toBeInstanceOf(ResumeRefused);
    expect(refused.message).toBe(reason);
  });

  it("keeps any other failure's report off the screen", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 500 })));

    await expect(uploadResume("t", file)).rejects.toThrow("Backend answered 500");
  });

  it("ends the session when the backend refuses the token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 403 })));

    await expect(uploadResume("t", file)).rejects.toBeInstanceOf(SessionEnded);
  });
});
