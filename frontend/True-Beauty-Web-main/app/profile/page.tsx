import { Suspense } from "react";
import ProfileClient from "./ProfileClient";

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen gradient-bg flex items-center justify-center">
          <p className="text-gray-500">Loading…</p>
        </div>
      }
    >
      <ProfileClient />
    </Suspense>
  );
}
