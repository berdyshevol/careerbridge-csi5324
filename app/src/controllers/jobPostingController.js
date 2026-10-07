import * as jobPostingService from "@/services/jobPostingService";

// Translates HTTP requests into service calls and results into responses.
export async function listPostings() {
  const postings = await jobPostingService.listOpenPostings();
  return Response.json(postings);
}

export async function getPosting(jobPostId) {
  const posting = await jobPostingService.getPosting(jobPostId);
  if (!posting) {
    return Response.json({ error: "Job posting not found" }, { status: 404 });
  }
  return Response.json(posting);
}
