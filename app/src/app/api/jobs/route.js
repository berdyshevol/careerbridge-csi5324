import { listPostings } from "@/controllers/jobPostingController";

export async function GET() {
  return listPostings();
}
