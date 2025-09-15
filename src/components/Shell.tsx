import React from "react";
import { Link } from "react-router-dom";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen p-6">
      <header className="mb-6 ">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#AE4B1E] to-[#F6921E]" />
            <div className="header-logo">CFF C.L.E.A.R.</div>
          </Link>
          <nav className="text-sm text-neutral-300">
            <Link to="/" className="mr-4 header-logo">Upload</Link>
            <Link to="/admin/login" className="mr-4 header-logo">Admin</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl">{children}</main>

      <footer className="mt-12 text-center text-sm text-neutral-400">
        © {new Date().getFullYear()} CFF C.L.E.A.R. — Private admin access only.
      </footer>
    </div>
  );
}
