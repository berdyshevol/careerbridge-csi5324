import { readFileSync } from "node:fs";
import type { APIRequestContext, APIResponse } from "@playwright/test";

// Talks to the backend the way the frontend does, and answers in the words of the domain model,
// so the DSL never sees a status code or a JSON shape (ADR-0011).

const BACKEND = "http://localhost:8080";

export type Account = { email: string; password: string };
type Token = { Authorization: string };

export type PostingCriteria = {
  keyword?: string;
  location?: string;
  organization?: string;
  employmentType?: string;
};

export type NewJobPosting = {
  organizationId: number;
  title: string;
  description: string;
  jobRequirements: string;
  location: string;
  employmentType: string;
  salaryRange: string;
  numberOfOpenings: number;
  applicationDeadline: string;
};

// What UC-01 step 2 says a visitor receives for each posting
export type PostingDetails = {
  title: string;
  organization: string;
  location: string;
  employmentType: string;
  applicationDeadline: string;
  description: string;
  jobRequirements: string;
  numberOfOpenings: number;
};

export type SearchOutcome = {
  postings: PostingDetails[];
  // Anything the answer carries, details or not, so a test can say what must never be in it (BR-15)
  mentions(text: string): boolean;
};

type PublicPosting = Omit<PostingDetails, "organization"> & {
  jobPostId: number;
  organization: { organizationId: number; name: string };
};

async function expectOk(answer: APIResponse, what: string) {
  if (!answer.ok()) {
    throw new Error(`${what} was refused: ${answer.status()} ${await answer.text()}`);
  }
  return answer;
}

export class ApiDriver {
  private tokens = new Map<string, Token>();

  constructor(private readonly request: APIRequestContext) {}

  async searchPostings(criteria: PostingCriteria, as?: Account): Promise<SearchOutcome> {
    const params = Object.fromEntries(Object.entries(criteria).filter(([, value]) => value !== undefined));
    const answer = await expectOk(
      await this.request.get(`${BACKEND}/api/postings`, {
        params,
        headers: as ? await this.tokenOf(as) : {},
      }),
      "Searching the job postings",
    );
    const body = await answer.text();
    const found = JSON.parse(body) as PublicPosting[];
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
    };
  }

  // No organization can be created through the API yet (UC-08), so the sample ones are found
  // through their published postings.
  async organizationIdOf(name: string): Promise<number> {
    const answer = await expectOk(
      await this.request.get(`${BACKEND}/api/postings`, { params: { organization: name } }),
      `Looking up the organization ${name}`,
    );
    const match = ((await answer.json()) as PublicPosting[]).find((posting) => posting.organization.name === name);
    if (!match) throw new Error(`No published posting of the sample organization ${name} to find it by`);
    return match.organization.organizationId;
  }

  async createPosting(recruiter: Account, posting: NewJobPosting): Promise<number> {
    const answer = await expectOk(
      await this.request.post(`${BACKEND}/api/postings`, { data: posting, headers: await this.tokenOf(recruiter) }),
      `Creating the posting ${posting.title}`,
    );
    return (await answer.json()).jobPostId;
  }

  async submitPosting(recruiter: Account, jobPostId: number) {
    await expectOk(
      await this.request.post(`${BACKEND}/api/postings/${jobPostId}/submit`, { headers: await this.tokenOf(recruiter) }),
      `Submitting posting ${jobPostId}`,
    );
  }

  async decidePosting(administrator: Account, jobPostId: number, decision: "approve" | "return" | "reject") {
    await expectOk(
      await this.request.post(`${BACKEND}/api/admin/postings/${jobPostId}/${decision}`, {
        data: { comment: `Decided by an acceptance test: ${decision}` },
        headers: await this.tokenOf(administrator),
      }),
      `Deciding posting ${jobPostId}: ${decision}`,
    );
  }

  async registerApplicant(fullName: string, account: Account) {
    const answer = await expectOk(
      await this.request.post(`${BACKEND}/api/applicants`, { data: { fullName, ...account } }),
      `Registering ${account.email}`,
    );
    this.tokens.set(account.email, { Authorization: `Bearer ${(await answer.json()).token}` });
  }

  async uploadResume(applicant: Account, path: string) {
    await expectOk(
      await this.request.post(`${BACKEND}/api/applicant/resume`, {
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
      await this.request.post(`${BACKEND}/api/postings/${jobPostId}/application`, {
        headers: await this.tokenOf(applicant),
      }),
      `Applying to posting ${jobPostId}`,
    );
  }

  private async tokenOf(account: Account): Promise<Token> {
    const known = this.tokens.get(account.email);
    if (known) return known;
    const answer = await expectOk(
      await this.request.post(`${BACKEND}/api/auth/login`, { data: account }),
      `Logging in as ${account.email}`,
    );
    const token = { Authorization: `Bearer ${(await answer.json()).token}` };
    this.tokens.set(account.email, token);
    return token;
  }
}
