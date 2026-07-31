import { ProfileCard } from "@/features/identity";

export default function ProfilePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold font-heading text-(--color-foreground)">
        My profile
      </h1>
      <ProfileCard />
    </div>
  );
}
