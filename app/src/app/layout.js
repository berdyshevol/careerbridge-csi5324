import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "CareerBridge",
  description: "Recruiting and Application Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            CareerBridge
          </Link>
          <nav>
            <Link href="/jobs">Jobs</Link>
            <Link href="/applications">My applications</Link>
            <Link href="/recruiter/postings/new">Post a job</Link>
            <Link href="/register">Register</Link>
          </nav>
        </header>
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
