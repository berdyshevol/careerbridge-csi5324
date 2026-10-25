import { clearSession, parseSession, readSession, safeNext, saveSession, type Session } from "./session";

const session: Session = {
  token: "a.b.c",
  user: { firstName: "Riley", lastName: "Chen", email: "riley.chen@example.com", phone: null, role: "RECRUITER" },
};

describe("session", () => {
  afterEach(() => clearSession());

  it("keeps the session in a cookie and forgets it on log-out", () => {
    saveSession(session);
    expect(readSession()).toEqual(session);

    clearSession();
    expect(readSession()).toBeNull();
  });

  it("reads the cookie as the browser and as Next.js hand it over", () => {
    const json = JSON.stringify(session);
    expect(parseSession(json)).toEqual(session);
    expect(parseSession(encodeURIComponent(json))).toEqual(session);
  });

  it("treats a broken or foreign cookie as no session", () => {
    expect(parseSession(undefined)).toBeNull();
    expect(parseSession("not json")).toBeNull();
    expect(parseSession(JSON.stringify({ token: "x", user: { role: "ROOT" } }))).toBeNull();
    expect(parseSession(JSON.stringify({ token: "x", user: { firstName: "A", lastName: "B", role: "toString" } }))).toBeNull();
    expect(parseSession(JSON.stringify({ token: "x", user: { role: "APPLICANT" } }))).toBeNull();
  });

  it("goes back only to a page of this site, otherwise to the role's own page", () => {
    expect(safeNext("/jobs/3/apply", "APPLICANT")).toBe("/jobs/3/apply");
    expect(safeNext("//evil.example", "APPLICANT")).toBe("/");
    expect(safeNext("/\\evil.example", "APPLICANT")).toBe("/");
    expect(safeNext("/jobs?keyword=java", "APPLICANT")).toBe("/jobs?keyword=java");
    expect(safeNext("https://evil.example", "ADMINISTRATOR")).toBe("/admin/postings");
    expect(safeNext(undefined, "RECRUITER")).toBe("/recruiter/postings/new");
    expect(safeNext("/login", "APPLICANT")).toBe("/");
  });
});
