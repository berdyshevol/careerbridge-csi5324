import path from "node:path";
import { randomUUID } from "node:crypto";
import { test as base } from "@playwright/test";
import { ACCOUNTS } from "../../e2e/accounts";
import type { NewPosting, ReviewAction } from "../../src/lib/api";
import { ApiDriver, type Account } from "../drivers/api";
import type {
  Administrator,
  Applicant,
  Applicants,
  BoardAnswer,
  Calendar,
  EmploymentType,
  Employers,
  FoundPosting,
  JobBoard,
  JobPosting,
  JobPostingDetails,
  Location,
  OrganizationName,
  Role,
  SearchCriteria,
  UC01Fixtures,
} from "./vocabulary";

// Realizes the vocabulary of ./vocabulary.ts over the backend's HTTP interface (ADR-0011). Tests run
// in parallel against one database, so every posting a spec names gets a title of its own here and
// the board's answer is read back through that title.

// The words of these defaults are no keyword of any spec, so a keyword search finds a posting only
// through what the spec itself gave it
const DEFAULTS = {
  organization: "Brazos Analytics",
  description: "Plan the week with the team and keep the customers informed.",
  jobRequirements: "Two years of professional experience.",
  location: "Remote",
  employmentType: "Full-time",
  daysUntilDeadline: 30,
  numberOfOpenings: 1,
} as const;

const RESUME = path.join(__dirname, "../../e2e/fixtures/Pat_Kim_Resume.pdf");
const PASSWORD = "Sunrise-2026x";

function notReachable(reason: string): never {
  throw new Error(`Not reachable through the public interface: ${reason}`);
}

// Hex alone could be all digits; a letter in front keeps it a word of its own
const token = () => `q${randomUUID().replace(/-/g, "").slice(0, 12)}`;

// The backend checks the deadline against its own local date (JobPostingService.submitJobPosting),
// and it runs on this machine
function inDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-CA");
}

type Created = { jobPostId: number; systemTitle: string; posting: JobPosting };

class World {
  readonly driver: ApiDriver;
  private readonly bySpecTitle = new Map<string, Created>();
  private readonly specTitleOf = new Map<string, string>();
  private readonly applicants = new Map<string, { account: Account; fullName: string; id: string }>();

  constructor(driver: ApiDriver) {
    this.driver = driver;
  }

  async createPosting(details: JobPostingDetails): Promise<Created> {
    if (details.place) {
      notReachable("a posting has no city, region or country: CreateJobPostingRequest takes only a location string");
    }
    if (this.bySpecTitle.has(details.title)) {
      throw new Error(`The specification creates "${details.title}" twice; titles name its postings`);
    }
    const posting: JobPosting = {
      title: details.title,
      organization: details.organization ?? DEFAULTS.organization,
      description: details.description ?? DEFAULTS.description,
      jobRequirements: details.jobRequirements ?? DEFAULTS.jobRequirements,
      location: details.location ?? DEFAULTS.location,
      employmentType: details.employmentType ?? DEFAULTS.employmentType,
      applicationDeadline: inDays(details.daysUntilDeadline ?? DEFAULTS.daysUntilDeadline),
      numberOfOpenings: details.numberOfOpenings ?? DEFAULTS.numberOfOpenings,
    };
    // The spec's words stay whole at the front, so a keyword taken from the title still matches
    const systemTitle = `${details.title} ${token()}`;
    const jobPostId = await this.driver.createPosting(ACCOUNTS.recruiter, {
      ...this.newPosting(posting, await this.driver.organizationIdOf(posting.organization)),
      title: systemTitle,
    });
    const created = { jobPostId, systemTitle, posting };
    this.bySpecTitle.set(details.title, created);
    this.specTitleOf.set(systemTitle, details.title);
    return created;
  }

  newPosting(posting: JobPosting, organizationId: number): NewPosting {
    return {
      organizationId,
      title: posting.title,
      description: posting.description,
      jobRequirements: posting.jobRequirements,
      location: posting.location,
      employmentType: posting.employmentType,
      salaryRange: null,
      numberOfOpenings: posting.numberOfOpenings,
      applicationDeadline: posting.applicationDeadline,
    };
  }

  posting(title: string): Created {
    const created = this.bySpecTitle.get(title);
    if (!created) throw new Error(`The specification never created the posting "${title}"`);
    return created;
  }

  async newApplicant(): Promise<Applicant> {
    const id = token();
    const fullName = `Casey ${id}`;
    const account = { email: `casey.${id}@example.com`, password: PASSWORD };
    await this.driver.registerApplicant(fullName, account);
    this.applicants.set(account.email, { account, fullName, id });
    return { fullName, email: account.email };
  }

  accountOf(as: Role | Applicant | undefined): Account | undefined {
    if (as === undefined || as === "Visitor") return undefined;
    if (as === "Applicant") return ACCOUNTS.applicant;
    if (as === "Recruiter") return ACCOUNTS.recruiter;
    if (as === "Administrator") return ACCOUNTS.administrator;
    const applicant = this.applicants.get(as.email);
    if (!applicant) throw new Error(`The specification never introduced the applicant ${as.email}`);
    return applicant.account;
  }

  async search(criteria: SearchCriteria, as?: Role | Applicant): Promise<BoardAnswer> {
    const outcome = await this.driver.searchPostings(
      {
        keyword: criteria.keywords,
        location: criteria.location,
        organization: criteria.organization,
        employmentType: criteria.employmentType,
      },
      this.accountOf(as),
    );
    const postings: FoundPosting[] = [];
    for (const found of outcome.postings) {
      const title = this.specTitleOf.get(found.title);
      if (title === undefined) continue;
      postings.push({
        title,
        organization: found.organization as OrganizationName,
        location: found.location as Location,
        employmentType: found.employmentType as EmploymentType,
        applicationDeadline: found.applicationDeadline,
        description: found.description,
        jobRequirements: found.jobRequirements,
        numberOfOpenings: found.numberOfOpenings,
        // The answer never says whether the applicant applied, so alreadyAppliedTo stays unset
      });
    }
    const disclosedApplicantData = [...this.applicants.values()]
      // The id on its own too: it is the last name, so a leak of the name in parts still shows
      .flatMap(({ account, fullName, id }) => [fullName, id, account.email])
      .filter((text) => outcome.mentions(text));
    return {
      postings,
      totalPostings: outcome.postings.length,
      failure: outcome.failure,
      disclosedApplicantData,
      responseTimeMs: outcome.responseTimeMs,
    };
  }
}

class RecruitersOfTheOrganizations implements Employers {
  constructor(private readonly world: World) {}

  async saveDraft(details: JobPostingDetails) {
    return (await this.world.createPosting(details)).posting;
  }

  async submitPosting(details: JobPostingDetails) {
    const created = await this.world.createPosting(details);
    await this.world.driver.submitPosting(ACCOUNTS.recruiter, created.jobPostId);
    return created.posting;
  }

  async publishPosting(details: JobPostingDetails) {
    const posting = await this.submitPosting(details);
    await this.world.driver.decidePosting(ACCOUNTS.administrator, this.world.posting(posting.title).jobPostId, "approve");
    return posting;
  }

  async hireApplicants(): Promise<void> {
    notReachable(
      "no offer can be made or accepted (UC-14, UC-15): the only application endpoints are " +
        "GET/POST /api/postings/{id}/application (ApplicationController) and GET /api/applicant/applications",
    );
  }

  async fillPosting(): Promise<void> {
    notReachable(
      "a posting is filled only by accepted offers (UC-07 A2), and no endpoint makes or accepts an offer " +
        "(controllers: ApplicationController, ApplicantApplicationsController, AdminJobPostingController)",
    );
  }
}

class TheAdministrator implements Administrator {
  constructor(private readonly world: World) {}

  private async decide(title: string, decision: ReviewAction) {
    await this.world.driver.decidePosting(ACCOUNTS.administrator, this.world.posting(title).jobPostId, decision);
  }

  approvePosting(title: string) {
    return this.decide(title, "approve");
  }

  returnPosting(title: string) {
    return this.decide(title, "return");
  }

  rejectPosting(title: string) {
    return this.decide(title, "reject");
  }
}

class NewApplicants implements Applicants {
  constructor(private readonly world: World) {}

  // An applicant of its own with a resume, since applying needs one (ApplicationService, NO_RESUME)
  async applyTo(title: string) {
    const applicant = await this.world.newApplicant();
    const account = this.world.accountOf(applicant)!;
    await this.world.driver.uploadResume(account, RESUME);
    await this.world.driver.apply(account, this.world.posting(title).jobPostId);
    return applicant;
  }
}

class PublicJobBoard implements JobBoard {
  constructor(private readonly world: World) {}

  search(criteria: SearchCriteria = {}, options: { as?: Role | Applicant } = {}) {
    return this.world.search(criteria, options.as);
  }

  uniqueKeyword() {
    return token();
  }

  async failNextSearch(): Promise<void> {
    notReachable(
      "nothing a caller sends makes the search fail: GET /api/postings is public, its criteria are free text " +
        "and JobPostingService.searchPostings accepts any of them; the database cannot be taken away from outside",
    );
  }

  async haveNoOpenPostings(): Promise<void> {
    notReachable(
      "the sample postings of jobs.csv are Published with deadlines in December 2026 and no endpoint closes or " +
        "withdraws a posting; the backend is also shared by the tests running in parallel",
    );
  }

  async holdOpenPostings(): Promise<void> {
    notReachable(
      "publishing 10,000 postings through the API works, but they would stay on the board that every other " +
        "acceptance and end-to-end test of the run shares (one backend per run); NFR-UC01.1 needs a system of its own",
    );
  }
}

class SystemCalendar implements Calendar {
  // Real time passes for real, so this waits; moving the system's clock is not possible from outside
  async letTimePass({ minutes }: { minutes: number }) {
    const ms = minutes * 60_000;
    base.info().setTimeout(base.info().timeout + ms);
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async reachDeadlineDayOf(): Promise<void> {
    notReachable(
      "the backend's Clock is Clock.systemUTC() (ClockConfig) with no endpoint to move it, and a posting cannot be " +
        "submitted with a deadline earlier than tomorrow (JobPostingService.submitJobPosting, MIN_DAYS_TO_DEADLINE = 1)",
    );
  }

  async passDeadlineOf(): Promise<void> {
    notReachable(
      "a submitted deadline is at least one day away (JobPostingService.submitJobPosting), the backend's Clock " +
        "cannot be moved from outside (ClockConfig), and the expiration run starts only on its 15-minute schedule " +
        "(JobPostingExpirationScheduler)",
    );
  }
}

// Fixtures hand over with "provide", not Playwright's usual "use", which React's lint rule takes for a hook
export const test = base.extend<UC01Fixtures & { world: World }>({
  world: async ({ request }, provide) => provide(new World(new ApiDriver(request))),
  employers: async ({ world }, provide) => provide(new RecruitersOfTheOrganizations(world)),
  administrator: async ({ world }, provide) => provide(new TheAdministrator(world)),
  applicants: async ({ world }, provide) => provide(new NewApplicants(world)),
  jobBoard: async ({ world }, provide) => provide(new PublicJobBoard(world)),
  calendar: async ({}, provide) => provide(new SystemCalendar()),
});
