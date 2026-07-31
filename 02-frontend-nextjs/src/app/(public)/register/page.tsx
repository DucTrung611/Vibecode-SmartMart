import Link from "next/link";
import { RegisterForm } from "@/features/identity";

export default function RegisterPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold font-heading text-(--color-foreground)">
        Create account
      </h1>
      <RegisterForm />
      <p className="text-sm text-(--color-muted-foreground)">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-(--color-accent) hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
