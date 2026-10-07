import { readFile } from "node:fs/promises";
import path from "node:path";
import { JobPosting } from "@/models/JobPosting";
import { parseCsv } from "@/utils/csv";

// Data access for job postings. Reads the sample file for now; when a
// database replaces it, only this file changes.
const JOBS_FILE = path.join(process.cwd(), "data", "jobs.csv");

export async function findAll() {
  const text = await readFile(JOBS_FILE, "utf8");
  return parseCsv(text).map((record) => new JobPosting(record));
}

export async function findById(jobPostId) {
  const postings = await findAll();
  return postings.find((posting) => posting.jobPostId === String(jobPostId)) ?? null;
}
