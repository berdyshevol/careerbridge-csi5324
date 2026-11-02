import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import Link from "next/link";
import AccountMenu from "@/components/AccountMenu";
import DeskNav from "@/components/DeskNav";
import { serverSession } from "@/lib/serverSession";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CareerBridge",
  description: "Recruiting and Application Management System",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Reading the cookie renders every page per request; the header and navigation follow the role
  const session = await serverSession();
  // Every role that logs in has a desk navigation, and on phones its dock covers the foot of the page
  const hasDesk = Boolean(session);

  return (
    <html lang="en" data-theme="careerbridge" className={`${figtree.variable} ${bricolage.variable}`}>
      <body className="min-h-screen bg-base-200 font-sans text-base-content">
        <header className="border-b border-base-300 bg-base-100">
          <div className="flex h-16 items-center gap-3 px-4 md:px-6 lg:gap-7 lg:px-8">
            <Link href="/" className="font-display text-xl font-semibold">
              CareerBridge
            </Link>
            <div className="grow" />
            <AccountMenu user={session?.user ?? null} />
          </div>
        </header>
        <div className="flex flex-col gap-5 px-4 py-5 md:px-6 md:py-6 lg:flex-row lg:gap-7 lg:px-8 lg:py-7">
          <DeskNav role={session?.user.role ?? null} />
          {/* A visitor's pages have no desk beside them, so they stand in the middle of a wide screen */}
          <main className={hasDesk ? "min-w-0 flex-1" : "mx-auto w-full min-w-0 max-w-6xl"}>{children}</main>
        </div>
        <footer
          className={`flex flex-wrap gap-x-6 gap-y-2 px-4 text-sm text-muted md:px-6 md:pb-8 lg:px-8 ${hasDesk ? "pb-24" : "pb-6"}`}
        >
          <Link href="/about" className="link-hover link">
            About CareerBridge
          </Link>
        </footer>
      </body>
    </html>
  );
}
