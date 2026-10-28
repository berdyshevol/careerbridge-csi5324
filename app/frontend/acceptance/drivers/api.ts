import { readFileSync } from "node:fs";
import type { APIRequestContext, APIResponse } from "@playwright/test";
import { tokenOf } from "../../e2e/accounts";
import type { JobPosting, NewPosting, PostingSearchCriteria, ReviewAction } from "../../src/lib/api";

// Talks to the backend the way the frontend does, and answers in the words of the domain model,
// so the DSL never sees a status code or a JSON shape (ADR-0011). Paths are relative to the
// acceptance project's baseURL, the backend.

export type Account = { email: string; password: string };
type Token = { Authorization: string };

// What UC-01 step 2 says a visitor receives for each posting
export type PostingDetails = Pick<
  JobPosting,
  "title" | "location" | "employmentType" | "applicationDeadline" | "description" | "jobRequirements" | "numberOfOpenings"
> & { organization: string };

export type SearchOutcome = {
  postings: PostingDetails[];
  // Anything the answer carries, details or not, so a test can say what must never be in it (BR-15)
  mentions(text: string): boolean;
  // Set instead of postings when the system answered with an error, so a failure never reads as "none found"
  failure?: string;
  responseTimeMs: number;
};

// Sample data, the same for the whole run
const organizationIds = new Map<string, number>();

async function expectOk(answer: APIResponse, what: string) {
  if (!answer.ok()) {
    throw new Error(`${what} was refused: ${answer.status()} ${await answer.text()}`);
  }
  return answer;
}

export class ApiDriver {
  private tokens = new Map<string, Token>();

  constructor(private readonly request: APIRequestContext) {}

  async searchPostings(criteria: PostingSearchCriteria, as?: Account): Promise<SearchOutcome> {
    const params = Object.fromEntries(Object.entries(criteria).filter(([, value]) => value !== undefined));
    const headers = as ? await this.tokenOf(as) : {};
    // Only the search itself is timed (NFR-UC01.1), not logging in
    const started = performance.now();
    const answer = await this.request.get(`/api/postings`, { params, headers });
    const body = await answer.text();
    const responseTimeMs = performance.now() - started;
    if (!answer.ok()) {
      return {
        postings: [],
        mentions: () => false,
        failure: `Searching the job postings was refused: ${answer.status()} ${body}`,
        responseTimeMs,
      };
    }
    const found = JSON.parse(body) as JobPosting[];
    return {
      postings: found.map((posting) => ({
        title: posting.title,
        organization: posting.organization.name,
        location: posting.location,
        employmentType: posting.employmentType,
        applicationDeadline: posting.applicationDeadline,
        description: posting.description,
        jobRequirements: posting.jobRequirements,
        numberOfOpenings: posting.numberOfOpenings,
      })),
      mentions: (text) => body.toLowerCase().includes(text.toLowerCase()),
      responseTimeMs,
    };
  }

  // No organization can be created through the API yet (UC-08), so the sample ones are found
  // through the sample postings. A posting stays readable by id after it closes, so this still
  // works once the sample deadlines in jobs.csv have passed; drafts and pending ones answer 404.
  async organizationIdOf(name: string): Promise<number> {
    for (let jobPostId = 1; !organizationIds.has(name); jobPostId++) {
      if (jobPostId > 50) throw new Error(`No sample posting of the organization ${name} to find it by`);
      const answer = await this.request.get(`/api/postings/${jobPostId}`);
      if (answer.ok()) {
        const { organization } = (await answer.json()) as JobPosting;
        organizationIds.set(organization.name, organization.organizationId);
      }
    }
    return organizationIds.get(name)!;
  }

  async createPosting(recruiter: Account, posting: NewPosting): Promise<number> {
    const answer = await expectOk(
      await this.request.post(`/api/postings`, { data: posting, headers: await this.tokenOf(recruiter) }),
      `Creating the posting ${posting.title}`,
    );
    return (await answer.json()).jobPostId;
  }

  async submitPosting(recruiter: Account, jobPostId: number) {
    await expectOk(
      await this.request.post(`/api/postings/${jobPostId}/submit`, { headers: await this.tokenOf(recruiter) }),
      `Submitting posting ${jobPostId}`,
    );
  }

  async decidePosting(administrator: Account, jobPostId: number, decision: ReviewAction) {
    await expectOk(
      await this.request.post(`/api/admin/postings/${jobPostId}/${decision}`, {
        data: { comment: `Decided by an acceptance test: ${decision}` },
        headers: await this.tokenOf(administrator),
      }),
      `Deciding posting ${jobPostId}: ${decision}`,
    );
  }

  async registerApplicant(fullName: string, account: Account) {
    const answer = await expectOk(
      await this.request.post(`/api/applicants`, { data: { fullName, ...account } }),
      `Registering ${account.email}`,
    );
    this.tokens.set(account.email, { Authorization: `Bearer ${(await answer.json()).token}` });
  }

  async uploadResume(applicant: Account, path: string) {
    await expectOk(
      await this.request.post(`/api/applicant/resume`, {
        multipart: {
          file: { name: path.split("/").pop()!, mimeType: "application/pdf", buffer: readFileSync(path) },
        },
        headers: await this.tokenOf(applicant),
      }),
      `Uploading a resume for ${applicant.email}`,
    );
  }

  async apply(applicant: Account, jobPostId: number) {
    await expectOk(
      await this.request.post(`/api/postings/${jobPostId}/application`, {
        headers: await this.tokenOf(applicant),
      }),
      `Applying to posting ${jobPostId}`,
    );
  }

  private async tokenOf(account: Account): Promise<Token> {
    if (!this.tokens.has(account.email)) this.tokens.set(account.email, await tokenOf(this.request, account));
    return this.tokens.get(account.email)!;
  }
}
