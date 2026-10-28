import { randomUUID } from "node:crypto";
import { expect, test as base } from "@playwright/test";
import { ACCOUNTS } from "../../e2e/accounts";
import { ApiDriver, type Account, type PostingCriteria, type PostingDetails, type SearchOutcome } from "../drivers/api";

// The language of the specifications (ADR-0011). A specification names a posting by its title,
// such as "Backend Developer"; here that title becomes unique to the test, so tests running at
// the same time against one database never see each other's postings, and every value a
// specification leaves out gets a valid default.

export type PostingSpec = {
  title: string;
  organization?: string;
  location?: string;
  employmentType?: string;
  description?: string;
  jobRequirements?: string;
  numberOfOpenings?: number;
};

// The postStatus values a posting can be left in before it is published (domain model)
export type UnpublishedStatus = "Draft" | "Pending Approval" | "Returned" | "Rejected";

function inDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-CA"); // YYYY-MM-DD in the local zone, as the backend reads it
}

class World {
  readonly driver: ApiDriver;
  // A retry runs against the same database, so the suffix is new on every attempt
  private readonly suffix = ` [${randomUUID().slice(0, 8)}]`;
  private readonly postings = new Map<string, { jobPostId: number; details: PostingDetails }>();
  private readonly applicants = new Map<string, Account>();
  private lastSearch?: SearchOutcome;

  constructor(driver: ApiDriver) {
    this.driver = driver;
  }

  async createPosting(spec: PostingSpec): Promise<number> {
    const details: PostingDetails = {
      title: spec.title + this.suffix,
      organization: spec.organization ?? "Brazos Analytics",
      location: spec.location ?? "Remote",
      employmentType: spec.employmentType ?? "Full-time",
      applicationDeadline: inDays(30),
      description: spec.description ?? "Build and run the services behind the product.",
      jobRequirements: spec.jobRequirements ?? "Two years of professional experience.",
      numberOfOpenings: spec.numberOfOpenings ?? 1,
    };
    const jobPostId = await this.driver.createPosting(ACCOUNTS.recruiter, {
      ...details,
      organizationId: await this.driver.organizationIdOf(details.organization),
      salaryRange: "$80,000 - $100,000",
    });
    this.postings.set(spec.title, { jobPostId, details });
    return jobPostId;
  }

  posting(title: string) {
    const posting = this.postings.get(title);
    if (!posting) throw new Error(`The specification never created the posting "${title}"`);
    return posting;
  }

  async search(criteria: PostingCriteria, as?: Account) {
    // A keyword that names one of this test's postings stands for that posting's unique title
    const keyword = this.postings.get(criteria.keyword ?? "")?.details.title ?? criteria.keyword;
    this.lastSearch = await this.driver.searchPostings({ ...criteria, keyword }, as);
  }

  get searched(): SearchOutcome {
    if (!this.lastSearch) throw new Error("The specification confirms a search it never made");
    return this.lastSearch;
  }

  // This test's postings in the last answer, in its order, by the titles the specification used
  ownPostingsFound(): { title: string; details: PostingDetails }[] {
    return this.searched.postings
      .filter((posting) => posting.title.endsWith(this.suffix))
      .map((posting) => ({ title: posting.title.slice(0, -this.suffix.length), details: posting }));
  }

  async newApplicant(name: string): Promise<Account> {
    const account = {
      email: `${name.toLowerCase().replace(/\W+/g, ".")}.${randomUUID().slice(0, 8)}@example.com`,
      password: "Sunrise-2026x",
    };
    await this.driver.registerApplicant(name, account);
    this.applicants.set(name, account);
    return account;
  }

  applicant(name: string) {
    const account = this.applicants.get(name);
    if (!account) throw new Error(`The specification never introduced the applicant "${name}"`);
    return account;
  }
}

export class Employers {
  constructor(private readonly world: World) {}

  // A recruiter creates and submits it, and the Administrator approves it (UC-11, UC-12)
  async publishPosting(spec: PostingSpec) {
    const jobPostId = await this.world.createPosting(spec);
    await this.world.driver.submitPosting(ACCOUNTS.recruiter, jobPostId);
    await this.world.driver.decidePosting(ACCOUNTS.administrator, jobPostId, "approve");
  }

  async leavePosting(status: UnpublishedStatus, spec: PostingSpec) {
    const jobPostId = await this.world.createPosting(spec);
    if (status === "Draft") return;
    await this.world.driver.submitPosting(ACCOUNTS.recruiter, jobPostId);
    if (status === "Returned") await this.world.driver.decidePosting(ACCOUNTS.administrator, jobPostId, "return");
    if (status === "Rejected") await this.world.driver.decidePosting(ACCOUNTS.administrator, jobPostId, "reject");
  }
}

export class Applicants {
  constructor(private readonly world: World) {}

  // A new applicant with a resume of their own, so no other test's applications get in the way
  async apply({ name, to }: { name: string; to: string }) {
    const applicant = await this.world.newApplicant(name);
    await this.world.driver.uploadResume(applicant, "e2e/fixtures/Pat_Kim_Resume.pdf");
    await this.world.driver.apply(applicant, this.world.posting(to).jobPostId);
  }
}

export class JobBoard {
  constructor(private readonly world: World) {}

  async search(criteria: PostingCriteria = {}) {
    await this.world.search(criteria);
  }

  async searchLoggedInAsApplicant(criteria: PostingCriteria = {}) {
    await this.world.search(criteria, ACCOUNTS.applicant);
  }

  // Exactly these of the test's postings, in this order; other tests' postings are not its concern
  confirmShows(titles: string[]) {
    expect(this.world.ownPostingsFound().map((found) => found.title)).toEqual(titles);
  }

  confirmShowsDetailsOf(title: string) {
    const found = this.world.ownPostingsFound().find((posting) => posting.title === title);
    expect(found, `"${title}" is on the job board`).toBeDefined();
    expect(found!.details).toEqual(this.world.posting(title).details);
  }

  confirmNoMatches() {
    expect(this.world.searched.postings).toEqual([]);
  }

  confirmRevealsNothingAbout(applicantName: string) {
    const applicant = this.world.applicant(applicantName);
    expect(this.world.searched.mentions(applicant.email), "the applicant's email").toBe(false);
    expect(this.world.searched.mentions(applicantName), "the applicant's name").toBe(false);
  }
}

// Fixtures hand over with "provide", not Playwright's usual "use", which React's lint rule takes for a hook
export const test = base.extend<{ world: World; employers: Employers; applicants: Applicants; jobBoard: JobBoard }>({
  world: async ({ request }, provide) => provide(new World(new ApiDriver(request))),
  employers: async ({ world }, provide) => provide(new Employers(world)),
  applicants: async ({ world }, provide) => provide(new Applicants(world)),
  jobBoard: async ({ world }, provide) => provide(new JobBoard(world)),
});
