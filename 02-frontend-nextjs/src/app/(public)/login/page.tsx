import Link from "next/link";
import { LoginForm } from "@/features/identity";

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold font-heading text-(--color-foreground)">
        Log in
      </h1>
      {redirect && (
        <p className="text-sm text-(--color-muted-foreground)" role="status">
          Please log in to continue.
        </p>
      )}
      <LoginForm />
      <p className="text-sm text-(--color-muted-foreground)">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-(--color-accent) hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
