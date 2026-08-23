import { redirect } from "next/navigation";
import { hasAdminSession } from "../../lib/admin-auth";
import QrDashboard from "./qr-dashboard";

export default async function AdminQrPage() {
  if (!(await hasAdminSession())) {
    redirect("/admin/login");
  }

  return <QrDashboard />;
}
