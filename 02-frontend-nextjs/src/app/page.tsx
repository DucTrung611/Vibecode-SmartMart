import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold font-heading tracking-tight text-(--color-foreground)">
        SmartMart
      </h1>
      <p className="max-w-md text-(--color-muted-foreground)">
        E-commerce platform — sign in or create an account to get started.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="cursor-pointer rounded-lg bg-(--color-accent) px-6 py-3 font-semibold text-(--color-on-primary) transition-colors duration-200 hover:bg-(--color-accent-hover)"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="cursor-pointer rounded-lg border border-(--color-border) px-6 py-3 font-semibold text-(--color-foreground) transition-colors duration-200 hover:border-(--color-foreground)"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}
