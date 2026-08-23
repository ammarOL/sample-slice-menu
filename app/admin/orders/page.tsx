import { redirect } from "next/navigation";
import { hasAdminSession } from "../../lib/admin-auth";
import OrdersDashboard from "./orders-dashboard";

export default async function AdminOrdersPage() {
  if (!(await hasAdminSession())) {
    redirect("/admin/login");
  }

  return <OrdersDashboard />;
}
