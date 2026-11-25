import { SessionEnded,
  BACKEND_TIMEOUT_MS,
  createPosting,
  formatDate,
  formatUtcDay,
  isOpen,
  openPostingForEdit,
  PostingRejected,
  searchPostings,
  searchCriteria,
  searchQuery,
  startApplication,
  submitApplication,
  viewApplication,
  viewApplications,
  viewRecruiterPostings,
  updatePosting,
  updateProfile,
  viewProfile,
  viewUsers,
  ApplicationActionRefused,
  ApplicationRefused,
  acceptOffer,
  declineOffer,
  OfferRevised,
  ProfileRefused,
  ResumeRefused,
  requestWithdrawal,
  uploadResume,
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

describe("viewUsers", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reads the users with the administrator's token", async () => {
    const directory = { users: [], usersByRole: { APPLICANT: 0, RECRUITER: 0, ADMINISTRATOR: 1 } };
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(directory), { status: 200 }));
    vi.stubGlobal("fetch", fetch);

    await expect(viewUsers("t")).resolves.toEqual(directory);

    const [url, init] = fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/admin\/users$/);
    expect(init.headers.Authorization).toBe("Bearer t");
  });

  it.each([401, 403])("ends the session when the backend refuses the token: %i", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status })));

    await expect(viewUsers("t")).rejects.toBeInstanceOf(SessionEnded);
  });
});

describe("openPostingForEdit and updatePosting", () => {
  afterEach(() => vi.unstubAllGlobals());

  function answer(status: number, body: string, contentType: string) {
    const fetch = vi.fn().mockResolvedValue(new Response(body, { status, headers: { "Content-Type": contentType } }));
    vi.stubGlobal("fetch", fetch);
    return fetch;
  }

  const changes = {
    title: "Nurse Scheduler",
    description: "",
    jobRequirements: "",
    location: "Hybrid",
    employmentType: "Full-time",
    salaryRange: null,
    numberOfOpenings: 1,
    applicationDeadline: "2999-12-31",
  };

  it("reads the recruiter's own posting with the token", async () => {
    const draft = posting({ postStatus: "DRAFT" });
    const fetch = answer(200, JSON.stringify(draft), "application/json");

    await expect(openPostingForEdit("t", 7)).resolves.toEqual(draft);

    const [url, init] = fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/postings\/7\/edit$/);
    expect(init.headers.Authorization).toBe("Bearer t");
  });

  it.each([403, 409])("passes on the reason a posting cannot be changed, not an ended session: %i", async (status) => {
    answer(status, "Only the recruiter who created this posting can change it", "text/plain;charset=UTF-8");

    const refused = await openPostingForEdit("t", 7).catch((error) => error);

    expect(refused).toBeInstanceOf(PostingRejected);
    expect(refused.message).toBe("Only the recruiter who created this posting can change it");
  });

  it("says there is no posting for a 404", async () => {
    answer(404, '{"status":404}', "application/json");

    await expect(openPostingForEdit("t", 7)).rejects.toThrow("There is no posting at this address.");
  });

  it("ends the session for a 403 without a reason", async () => {
    answer(403, "", "application/json");

    await expect(openPostingForEdit("t", 7)).rejects.toBeInstanceOf(SessionEnded);
  });

  it("puts the changes and returns the saved posting", async () => {
    const saved = posting({ postStatus: "RETURNED" });
    const fetch = answer(200, JSON.stringify(saved), "application/json");

    await expect(updatePosting("t", 7, changes)).resolves.toEqual(saved);

    const [url, init] = fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/postings\/7$/);
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body)).toEqual(changes);
  });

  it("passes on the reason when the backend refuses the changes", async () => {
    answer(400, "Job title is required", "text/plain;charset=UTF-8");

    await expect(updatePosting("t", 7, changes)).rejects.toThrow("Job title is required");
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
    dateApplied: "2026-10-02",
    lastStageChangeDate: "2026-10-02",
  };

  it("returns the active applications with their stage named as on the screen", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          applications: [
            answer,
            { ...answer, applicationId: 2, postingId: 3, applicationStatus: "INTERVIEW", lastStageChangeDate: "2026-10-05" },
          ],
          activeApplicationCount: 2,
          applicationLimit: 5,
        }),
    });
    vi.stubGlobal("fetch", fetch);

    const applications = await viewApplications("t");

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/applicant/applications"), expect.anything());
    expect(applications.activeApplicationCount).toBe(2);
    expect(applications.applicationLimit).toBe(5);
    expect(applications.active.map((a) => a.applicationStatus)).toEqual(["Applied", "Interview"]);
    expect(applications.all[1]).toMatchObject({
      applicationId: 2,
      postingId: 3,
      applicationStatus: "Interview",
      active: true,
      dateApplied: "2026-10-02",
      lastStageChangeDate: "2026-10-05",
    });
  });

  it("keeps an ended application in all and remembers its posting (A5)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            applications: [
              answer,
              { ...answer, applicationId: 4, postingId: 7, applicationStatus: "WITHDRAWN" },
              { ...answer, applicationId: 5, postingId: 8, applicationStatus: "OFFER_DECLINED" },
            ],
            activeApplicationCount: 1,
            applicationLimit: 5,
          }),
      }),
    );

    const applications = await viewApplications("t");

    expect(applications.activeApplicationCount).toBe(1);
    expect(applications.active.map((a) => a.postingId)).toEqual([1]);
    expect(applications.all.map((a) => [a.applicationStatus, a.active])).toEqual([
      ["Applied", true],
      ["Withdrawn", false],
      ["Offer Declined", false],
    ]);
    expect(applications.appliedPostingIds).toEqual([1, 7, 8]);
  });

  it("fails when the backend does not answer well", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(viewApplications("t")).rejects.toThrow("500");
  });
});

describe("viewApplication", () => {
  it("returns mapped detail with stage history and interviews", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            applicationId: 12,
            postingId: 3,
            title: "Backend Developer",
            organizationName: "Brazos Analytics",
            location: "Remote",
            employmentType: "Full-time",
            applicationStatus: "INTERVIEW",
            dateApplied: "2026-09-29",
            statusHistory: [
              { status: "APPLIED", date: "2026-09-29" },
              { status: "INTERVIEW", date: "2026-10-08" },
            ],
            interviews: [
              {
                interviewId: 1,
                roundNumber: 1,
                scheduledTime: "2026-10-11T14:00:00",
                format: "On-site",
                location: "1200 Austin Ave, Waco",
              },
            ],
            rejectionReason: null,
            rejectedAtStage: null,
            rejectionDate: null,
            withdrawnAt: null,
            availableActions: ["WITHDRAW"],
          }),
      }),
    );

    const detail = await viewApplication("t", "12");

    expect(detail?.applicationStatus).toBe("Interview");
    expect(detail?.statusHistory.map((e) => e.status)).toEqual(["Applied", "Interview"]);
    expect(detail?.interviews[0].location).toBe("1200 Austin Ave, Waco");
  });

  it("returns null on 404 when the application is not found or belongs to another applicant", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    expect(await viewApplication("t", "999")).toBeNull();
  });
});

describe("requestWithdrawal and withdrawApplication", () => {
  it("fetches withdrawal warning and confirms withdrawal with updated count", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            applicationId: 12,
            title: "Backend Developer",
            organizationName: "Brazos Analytics",
            applicationStatus: "INTERVIEW",
            warning: "Withdrawing this application is final.",
            reasons: ["No longer interested"],
          }),
      }).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            activeApplicationCount: 1,
            applicationLimit: 5,
            application: {
              applicationId: 12,
              postingId: 3,
              title: "Backend Developer",
              organizationName: "Brazos Analytics",
              location: "Remote",
              employmentType: "Full-time",
              applicationStatus: "WITHDRAWN",
              dateApplied: "2026-09-29",
              statusHistory: [{ status: "WITHDRAWN", date: "2026-10-10" }],
              interviews: [],
              rejectionReason: null,
              rejectedAtStage: null,
              rejectionDate: null,
              withdrawnAt: "2026-10-10T15:00:00Z",
              availableActions: [],
            },
          }),
      }),
    );

    const prompt = await requestWithdrawal("t", 12);
    expect(prompt.applicationStatus).toBe("Interview");

    const result = await withdrawApplication("t", 12, "No longer interested");
    expect(result.activeApplicationCount).toBe(1);
    expect(result.application.applicationStatus).toBe("Withdrawn");
  });

  it("throws ApplicationActionRefused on 409 conflict", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ currentStage: "OFFER", message: "Use Decline instead." }),
      }),
    );

    await expect(withdrawApplication("t", 12)).rejects.toBeInstanceOf(ApplicationActionRefused);
  });
});

describe("viewOffer, acceptOffer and declineOffer", () => {
  it("loads offer details and accepts or declines an offer", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              offerId: 5,
              applicationId: 15,
              postingId: 2,
              title: "IT Support Specialist",
              organizationName: "Baylor IT Services",
              dateExtended: "2026-10-16",
              startDate: "2027-07-19",
              salary: "$54,000 USD per year",
              terms: "Full-time on-site.",
              expirationDate: "2027-06-30",
              offerLetterFileName: "Offer.pdf",
              status: "PENDING",
              responseDate: null,
              revision: 1,
              expired: false,
              canRespond: true,
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              activeApplicationCount: 2,
              applicationLimit: 5,
              application: {
                applicationId: 15,
                postingId: 2,
                title: "IT Support Specialist",
                organizationName: "Baylor IT Services",
                location: "On-site",
                employmentType: "Full-time",
                applicationStatus: "HIRED",
                dateApplied: "2026-09-30",
                statusHistory: [{ status: "HIRED", date: "2026-11-01" }],
                interviews: [],
                offer: null,
                rejectionReason: null,
                rejectedAtStage: null,
                rejectionDate: null,
                withdrawnAt: null,
                availableActions: [],
              },
            }),
        }),
    );

    const offer = await viewOffer("t", 15);
    expect(offer.salary).toBe("$54,000 USD per year");

    const accepted = await acceptOffer("t", 15, 1);
    expect(accepted.application.applicationStatus).toBe("Hired");
    expect(accepted.activeApplicationCount).toBe(2);
  });

  it("throws OfferRevised on 409 OFFER_REVISED conflict", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: () =>
          Promise.resolve({
            code: "OFFER_REVISED",
            message: "Offer revised.",
            offer: {
              offerId: 5,
              dateExtended: "2026-10-16",
              startDate: "2027-07-19",
              salary: "$60,000 USD per year",
              terms: "Updated.",
              expirationDate: "2027-07-05",
              offerLetterFileName: null,
              status: "PENDING",
              responseDate: null,
              revision: 2,
              expired: false,
              canRespond: true,
            },
          }),
      }),
    );

    await expect(declineOffer("t", 15, "No thanks", 1)).rejects.toBeInstanceOf(OfferRevised);
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

describe("viewRecruiterPostings", () => {
  it("sends the recruiter's token and returns the organization with its postings", async () => {
    const body = { organizationName: "Waco Health Partners", postings: [] };
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(body) });
    vi.stubGlobal("fetch", fetch);

    expect(await viewRecruiterPostings("t")).toEqual(body);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/recruiter/postings"),
      expect.objectContaining({ headers: { Authorization: "Bearer t" } }),
    );
  });

  it("says the session ended when the backend refuses the token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));

    await expect(viewRecruiterPostings("t")).rejects.toBeInstanceOf(SessionEnded);
  });

  it("fails loudly on any other answer", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(viewRecruiterPostings("t")).rejects.toThrow("Backend answered 500");
  });
});
