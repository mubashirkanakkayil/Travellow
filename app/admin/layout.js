import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import AdminClientLayout from "./AdminClientLayout";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }) {
  // Server-side authentication & ADMIN role check
  const user = await getCurrentUser();

  // 1. Unauthenticated -> Redirect to sign-in
  if (!user) {
    redirect("/sign-in");
  }

  // 2. Authenticated but NOT ADMIN (USER or LOCAL_GUIDE) -> Redirect to /dashboard
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // 3. Authenticated ADMIN -> Render Admin Shell Layout
  return (
    <AdminClientLayout user={user}>
      {children}
    </AdminClientLayout>
  );
}
