import * as jobPostingRepository from "@/repositories/jobPostingRepository";

// Business rules for job postings. No HTTP and no file access here.
export async function listOpenPostings() {
  const postings = await jobPostingRepository.findAll();
  return postings.filter((posting) => posting.isOpen());
}

export async function getPosting(jobPostId) {
  return jobPostingRepository.findById(jobPostId);
}
