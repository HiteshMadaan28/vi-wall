import type { Metadata } from "next";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/auth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Always evaluate auth on the server for every request.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const configured = isAdminConfigured();
  const authed = configured && (await isAdminAuthenticated());

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-black">
        Admin <span className="neon-text">Console</span>
      </h1>

      {!configured ? (
        <div className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-6 text-amber-100">
          <p className="font-semibold">Admin access isn&apos;t configured.</p>
          <p className="mt-1 text-sm text-amber-100/80">
            Set <code>ADMIN_PASSWORD</code> and <code>ADMIN_SESSION_SECRET</code> in your
            environment to enable the admin console. See the README.
          </p>
        </div>
      ) : authed ? (
        <AdminDashboard />
      ) : (
        <AdminLogin />
      )}
    </div>
  );
}
