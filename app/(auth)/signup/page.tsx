import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SignUpForm from "./components/SignUpForm";

export default async function SignUpPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    const role = session.user?.role;
    if (role === "owner") redirect("/dashboard");
    else if (role === "guest") redirect("/tenancy");
    else redirect("/onboarding");
  }
  return <SignUpForm />;
}
