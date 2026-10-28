// What UC-01 requires of the board's answer. The implementation team calls these and must not change
// them: a failing expectation means the system, or the DSL's translation, disagrees with spec/.
import { expect } from "@playwright/test";
import type { BoardAnswer, JobPosting } from "./vocabulary";

const titlesIn = (answer: BoardAnswer) => answer.postings.map((posting) => posting.title);

// A failed search that looks like an empty one would make every "not found" expectation pass.
export function confirmAnswered(answer: BoardAnswer) {
  expect(answer.failure, "the system answered instead of reporting a failure").toBeUndefined();
}

export function confirmFound(answer: BoardAnswer, ...titles: string[]) {
  confirmAnswered(answer);
  for (const title of titles) {
    expect(titlesIn(answer), `"${title}" is among the postings returned`).toContain(title);
  }
}

export function confirmNotFound(answer: BoardAnswer, ...titles: string[]) {
  confirmAnswered(answer);
  for (const title of titles) {
    expect(titlesIn(answer), `"${title}" is not among the postings returned`).not.toContain(title);
  }
}

/** Of this test's postings, exactly these are returned, in any order. */
export function confirmFoundExactly(answer: BoardAnswer, titles: string[]) {
  confirmAnswered(answer);
  expect([...titlesIn(answer)].sort(), "this test's postings returned").toEqual([...titles].sort());
}

/** The titles appear in this order relative to each other; postings in between do not matter. */
export function confirmNewestFirst(answer: BoardAnswer, titlesNewestFirst: string[]) {
  confirmAnswered(answer);
  const order = titlesIn(answer).filter((title) => titlesNewestFirst.includes(title));
  expect(order, "newest first").toEqual(titlesNewestFirst);
}

/** UC-01 step 2: the posting is returned once, with every detail as the recruiter entered it. */
export function confirmDetails(answer: BoardAnswer, posting: JobPosting) {
  confirmAnswered(answer);
  const found = answer.postings.filter((candidate) => candidate.title === posting.title);
  expect(found, `"${posting.title}" is returned once`).toHaveLength(1);
  expect(found[0], `details of "${posting.title}"`).toMatchObject({
    title: posting.title,
    organization: posting.organization,
    location: posting.location,
    employmentType: posting.employmentType,
    applicationDeadline: posting.applicationDeadline,
    description: posting.description,
    jobRequirements: posting.jobRequirements,
    numberOfOpenings: posting.numberOfOpenings,
  });
}

/** The whole answer is empty; only meaningful with criteria unique to the test or an empty board. */
export function confirmNoPostings(answer: BoardAnswer) {
  confirmAnswered(answer);
  expect(answer.totalPostings, "postings returned").toBe(0);
}

export function confirmMessage(answer: BoardAnswer, message: string) {
  expect(answer.message, "message that comes with the answer").toBe(message);
}

export function confirmFailureReported(answer: BoardAnswer) {
  expect(answer.failure, "the system reported a failure").toBeTruthy();
}

export function confirmNoApplicantData(answer: BoardAnswer) {
  confirmAnswered(answer);
  expect(answer.disclosedApplicantData, "applicant data in a public answer").toEqual([]);
}

export function confirmAnsweredWithin(answer: BoardAnswer, seconds: number) {
  confirmAnswered(answer);
  expect(answer.responseTimeMs, `answered within ${seconds} s`).toBeLessThanOrEqual(seconds * 1000);
}

export function confirmMarkedAsApplied(answer: BoardAnswer, title: string, applied = true) {
  confirmAnswered(answer);
  const found = answer.postings.find((posting) => posting.title === title);
  expect(found, `"${title}" is returned`).toBeDefined();
  expect(found?.alreadyAppliedTo, `"${title}" is marked as already applied to`).toBe(applied);
}

/** Searching changes nothing (UC-01 postconditions), so a repeated search answers the same. */
export function confirmSameAnswer(first: BoardAnswer, second: BoardAnswer) {
  confirmAnswered(first);
  confirmAnswered(second);
  expect(second.postings, "the repeated search").toEqual(first.postings);
}
