import type { Metadata } from "next";
import { Suspense } from "react";

import { Providers } from "@/components/providers";
import { SignOutButton } from "@/components/sign-out-button";
import { TrialRegistry } from "@/components/trial-registry";
import { apiGet } from "@/lib/api";

import { meSchema } from "@/lib/api-schemas";

export const metadata: Metadata = { title: "Registry" };

export default async function RegistryPage() {
  const me = await apiGet("/api/me/", meSchema);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">TrialTrack</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {me.username}
            {me.is_staff ? " (admin)" : ""}
          </p>
        </div>
        <SignOutButton />
      </header>
      {me.is_demo && (
        <p
          role="note"
          className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200"
        >
          Demo admin: you can create trials (max 25) and edit or delete only the ones you create. Seeded data is read-only.
        </p>
      )}
      <Providers>
        <Suspense fallback={null}>
          <TrialRegistry isStaff={me.is_staff} />
        </Suspense>
      </Providers>
    </div>
  );
}