import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { AuthSessionProvider } from "@/components/session-provider";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <AuthSessionProvider>
      <div className="flex min-h-screen">
        <Sidebar userName={session.user.name || session.user.email || "Admin"} />
        <main className="flex-1 overflow-x-hidden px-6 py-8 sm:px-10">
          <div className="mx-auto w-full max-w-7xl animate-fade-in">{children}</div>
        </main>
      </div>
    </AuthSessionProvider>
  );
}
