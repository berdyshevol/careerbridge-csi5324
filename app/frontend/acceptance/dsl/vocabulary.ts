// The language the UC-01 acceptance specifications speak, taken from spec/use-cases.md (UC-01, UC-07,
// UC-11 to UC-13), spec/requirements.md and spec/domain-model.md. Types only: the implementation team
// realizes them in the DSL behind `test` from "../dsl".
//
// A posting is identified by the title a spec gives it. The DSL makes that title unique to the test
// run, keeping the spec's words intact as whole words, so keyword searches on those words still match,
// and translates it back when the board's answer is observed. Defaults the DSL fills in must not
// contain any word a spec uses as a keyword.

export type OrganizationName = "Brazos Analytics" | "Waco Health Partners" | "Lone Star Logistics";

/** Domain model 5.1: a Job Posting's location is On-site, Hybrid or Remote. */
export type Location = "On-site" | "Hybrid" | "Remote";

export type EmploymentType = "Full-time" | "Part-time" | "Internship" | "Contract" | "Temporary";

/** UC-01's primary actor and its specializations (use-case diagram, generalization). */
export type Role = "Visitor" | "Applicant" | "Recruiter" | "Administrator";

/** UC-11 variation 3b stores a location as city, region and country besides the work arrangement. */
export interface Place {
  city: string;
  region: string;
  country: string;
}

export interface Applicant {
  fullName: string;
  email: string;
}

/** What a recruiter enters in UC-11 step 3; everything but the title gets a valid default. */
export interface JobPostingDetails {
  title: string;
  organization?: OrganizationName;
  description?: string;
  jobRequirements?: string;
  location?: Location;
  place?: Place;
  employmentType?: EmploymentType;
  /** UC-11 step 5 allows 1 to 90 days. */
  daysUntilDeadline?: number;
  numberOfOpenings?: number;
}

/** A posting as it was created, defaults filled in. */
export interface JobPosting {
  title: string;
  organization: OrganizationName;
  description: string;
  jobRequirements: string;
  location: Location;
  employmentType: EmploymentType;
  /** A date, YYYY-MM-DD, read in the organization's time zone. */
  applicationDeadline: string;
  numberOfOpenings: number;
}

/** UC-01 step 1: any criterion may be left out, or given blank (""), and then does not narrow the search. */
export interface SearchCriteria {
  keywords?: string;
  /** A Location value; a place name only in the scenario that asks whether that is allowed. */
  location?: string;
  organization?: OrganizationName | "";
  employmentType?: EmploymentType | "";
}

/** One posting in the board's answer, with the details UC-01 step 2 names. */
export interface FoundPosting {
  title: string;
  organization: OrganizationName;
  location: Location;
  employmentType: EmploymentType;
  applicationDeadline: string;
  description: string;
  jobRequirements: string;
  numberOfOpenings: number;
  /** Only when the board says whether the searching applicant has already applied. */
  alreadyAppliedTo?: boolean;
}

/** The board's answer to one search, translated into domain terms. */
export interface BoardAnswer {
  /** The postings this test created that the answer contains, in the order the system returned them. */
  postings: FoundPosting[];
  /** Every posting in the answer, anyone's; meaningful only when the criteria are unique to the test. */
  totalPostings: number;
  /** A message that comes with the answer itself, such as "No matching postings.", if any. */
  message?: string;
  /** Set when the system reported a failure instead of answering (extension *a). */
  failure?: string;
  /** Names and email addresses of this test's applicants found anywhere in the answer (BR-15). */
  disclosedApplicantData: string[];
  responseTimeMs: number;
}

/** Recruiters of the three organizations, working through UC-11. */
export interface Employers {
  saveDraft(posting: JobPostingDetails): Promise<JobPosting>;
  /** Submitted for approval; Pending Approval until the Administrator decides. */
  submitPosting(posting: JobPostingDetails): Promise<JobPosting>;
  /** Submitted and approved by the Administrator, so it is Published. */
  publishPosting(posting: JobPostingDetails): Promise<JobPosting>;
  /** That many applicants apply, are offered the job and accept (UC-04, UC-14, UC-15, UC-07). */
  hireApplicants(title: string, count: number): Promise<void>;
  /** Accepted offers reach the posting's number of openings (A2), which closes it as Filled. */
  fillPosting(title: string): Promise<void>;
}

/** UC-12 decisions on a submitted posting. */
export interface Administrator {
  approvePosting(title: string): Promise<void>;
  returnPosting(title: string): Promise<void>;
  rejectPosting(title: string): Promise<void>;
}

export interface Applicants {
  /** A newly registered applicant applies to the posting (UC-02, UC-04). */
  applyTo(title: string): Promise<Applicant>;
}

/** UC-01: the public job board. */
export interface JobBoard {
  /** Searches as a Visitor who is not logged in unless a role or a particular applicant is given. */
  search(criteria?: SearchCriteria, options?: { as?: Role | Applicant }): Promise<BoardAnswer>;
  /** A search term that occurs in no posting of any test, so the whole answer can be asserted. */
  uniqueKeyword(): string;
  /** The next search fails inside the system (extension *a). */
  failNextSearch(): Promise<void>;
  /** No posting is open anywhere on the board; needs a system of its own (extension 2a). */
  haveNoOpenPostings(): Promise<void>;
  /** At least that many postings are open on the board (NFR-UC01.1). */
  holdOpenPostings(count: number): Promise<void>;
}

/** Time as the system sees it, with the Scheduler's expiration runs (UC-13). */
export interface Calendar {
  letTimePass(duration: { minutes: number }): Promise<void>;
  /** Late on the posting's deadline date in its organization's time zone, before 23:59. */
  reachDeadlineDayOf(title: string): Promise<void>;
  /** Past 23:59 on the deadline date; by default the Scheduler's next expiration run has also happened. */
  passDeadlineOf(title: string, options?: { expirationRun?: boolean }): Promise<void>;
}

/** The fixtures the specs receive from `test` in "../dsl". */
export interface UC01Fixtures {
  employers: Employers;
  administrator: Administrator;
  applicants: Applicants;
  jobBoard: JobBoard;
  calendar: Calendar;
}
