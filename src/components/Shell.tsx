import React from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/50 backdrop-blur-md border-b sticky top-0 z-50 border-blue-600">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          {/* Logo + Title */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
              C
            </div>
            <div>
              <div className="text-sm font-bold text-blue-600">CLEAR System</div>
              <div className="text-xs text-neutral-500">
                Contaminant Level Evaluation & Remediation
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex gap-6 text-sm font-medium text-neutral-700">
            <Link
              to="/"
              className="flex items-center gap-2 hover:text-blue-600 transition-colors"
            >
		<Home className="w-4 h-4" />
             <span>Home</span>
            </Link>
                    </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl p-6">{children}</main>

      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-neutral-400">
        © {new Date().getFullYear()} CFF C.L.E.A.R. —{" "}
        <Link
          className="underline hover:text-blue-500"
          to="/admin/login"
        >
          Private admin access only.
        </Link>
      </footer>
    </div>
  );
}

