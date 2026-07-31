"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/Button";
import { useSession } from "@/shared/context/session-context";
import { useLogout } from "../hooks/useLogout";

export function ProfileCard() {
  const router = useRouter();
  const { user } = useSession();
  const { mutate: logout, isPending } = useLogout();

  if (!user) return null;

  const handleLogout = () => {
    logout(undefined, { onSuccess: () => router.push("/login") });
  };

  return (
    <div className="w-full max-w-sm rounded-xl border border-(--color-border) bg-white p-6 shadow-(--shadow-md)">
      <p className="text-sm text-(--color-muted-foreground)">Signed in as</p>
      <p className="mt-1 text-lg font-semibold text-(--color-foreground)">
        {user.email}
      </p>
      <p className="mt-1 text-sm text-(--color-muted-foreground)">
        Status: {user.status}
      </p>
      <Button
        variant="secondary"
        className="mt-6 w-full"
        onClick={handleLogout}
        isLoading={isPending}
      >
        Log out
      </Button>
    </div>
  );
}
