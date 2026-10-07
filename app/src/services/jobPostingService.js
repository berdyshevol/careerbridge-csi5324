import { DOMAIN_ERRORS, DomainError } from "./errors";

// Business rules for job postings. No HTTP and no file access here;
// the repositories are passed in.
export default function createJobPostingService({ repositories }) {
  return {
    async listOpen() {
      const postings = await repositories.jobPostings.findAll();
      return postings.filter((posting) => posting.isOpen());
    },

    async getById(jobPostId) {
      const posting = await repositories.jobPostings.findById(jobPostId);
      if (!posting) {
        throw new DomainError(DOMAIN_ERRORS.NOT_FOUND, `Job posting ${jobPostId} not found`);
      }
      return posting;
    },
  };
}
