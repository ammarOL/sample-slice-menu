import { redirect } from "next/navigation";
import { hasAdminSession } from "../../lib/admin-auth";
import AnalyticsDashboard from "./analytics-dashboard";

export default async function AdminAnalyticsPage() {
  if (!(await hasAdminSession())) {
    redirect("/admin/login");
  }

  return <AnalyticsDashboard />;
}
