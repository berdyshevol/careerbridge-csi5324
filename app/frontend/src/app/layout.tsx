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

  return (
    <html lang="en" data-theme="careerbridge" className={`${figtree.variable} ${bricolage.variable}`}>
      <body className="min-h-screen bg-base-200 font-sans text-base-content">
        <header className="border-b border-base-300 bg-base-100">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 lg:gap-8 lg:px-8">
            <Link href="/" className="font-display text-xl font-semibold">
              CareerBridge
            </Link>
            <div className="grow" />
            <AccountMenu user={session?.user ?? null} />
          </div>
        </header>
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8">
          <DeskNav role={session?.user.role ?? null} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
        <footer className="mx-auto flex max-w-7xl flex-wrap gap-x-6 gap-y-2 px-4 pb-24 text-sm text-muted md:pb-8 lg:px-8">
          <Link href="/about" className="link-hover link">
            About CareerBridge
          </Link>
        </footer>
      </body>
    </html>
  );
}
