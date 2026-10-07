import { getPosting } from "@/controllers/jobPostingController";

export async function GET(request, { params }) {
  const { id } = await params;
  return getPosting(id);
}
