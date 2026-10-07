import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import Link from "next/link";
import DeskNav from "@/components/DeskNav";
import { SearchIcon } from "@/components/Icons";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CareerBridge",
  description: "Recruiting and Application Management System",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <html lang="en" data-theme="careerbridge" className={`${figtree.variable} ${bricolage.variable}`}>
      <body className="min-h-screen bg-base-200 font-sans text-base-content">
        <header className="border-b border-base-300 bg-base-100">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 lg:gap-8 lg:px-8">
            <Link href="/" className="font-display text-xl font-semibold">
              CareerBridge
            </Link>
            <form action="/jobs" className="hidden max-w-lg grow lg:block">
              <label className="input w-full bg-base-200">
                <SearchIcon className="size-4 text-muted" />
                <span className="sr-only">Search job postings</span>
                <input
                  type="search"
                  name="keyword"
                  placeholder="Search by title, organization or location"
                />
              </label>
            </form>
            <div className="grow" />
            <span className="hidden text-muted md:inline">{today}</span>
            <Link href="/jobs" aria-label="Search job postings" className="btn btn-square btn-ghost lg:hidden">
              <SearchIcon />
            </Link>
            <Link
              href="/profile"
              aria-label="Profile and resume"
              className="btn btn-circle btn-primary font-semibold"
            >
              JL
            </Link>
          </div>
        </header>
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8">
          <DeskNav />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
        <footer className="mx-auto flex max-w-7xl flex-wrap gap-x-6 gap-y-2 px-4 pb-24 text-sm text-muted md:pb-8 lg:px-8">
          <Link href="/register" className="link-hover link">
            Register as applicant
          </Link>
          <Link href="/recruiter/register" className="link-hover link">
            Register as recruiter
          </Link>
          <Link href="/recruiter/postings/new" className="link-hover link">
            Post a job
          </Link>
        </footer>
      </body>
    </html>
  );
}
