import { redirect } from "next/navigation";
import LoginForm from "./login-form";
import { hasAdminSession } from "../../lib/admin-auth";

export default async function AdminLoginPage() {
  if (await hasAdminSession()) {
    redirect("/admin");
  }

  return <LoginForm />;
}
